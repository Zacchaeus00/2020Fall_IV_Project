var bar_margin = {top: 30, right: 30, bottom: 80, left: 30},
    bar_width = 800 - bar_margin.left - bar_margin.right,
    bar_height = 500 - bar_margin.top - bar_margin.bottom,
    interval = 80;

var table_width = 800,
    table_height = 80;


function drawCalendar(dateData, year, data, mapsvg){
    document.getElementById('calendar').innerHTML = '';
    var weeksInMonth = function(month){
      var m = d3.timeMonth.floor(month)
      return d3.timeWeeks(d3.timeWeek.floor(m), d3.timeMonth.offset(m,1)).length;
    }
  
    // var minDate = d3.min(dateData, function(d) { return new Date(d.day) })
    // var maxDate = d3.max(dateData, function(d) { return new Date(d.day) })
    const minDate = new Date(year+'-01-01');
    const maxDate = new Date(year+'-12-31');
    // console.log(minDate)
    // console.log(maxDate)
  
    var cellMargin = 1,
        cellSize = 15
        leftMargin = 20;
  
    var day = d3.timeFormat("%w"),
        week = d3.timeFormat("%U"),
        format = d3.timeFormat("%Y-%m-%d"),
        weekday = d3.timeFormat('%A')
        titleFormat = d3.utcFormat("%a, %d-%b");
        monthName = d3.timeFormat("%B"),
        months= d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate);
  
    var svg = d3.select("#calendar").selectAll("svg")
      .data(months)
      .enter().append("svg")
      .attr("class", "month")
      .attr("height", ((cellSize * 7) + (cellMargin * 8) + 20) ) // the 20 is for the month labels
      .attr("width", function(d) {
        var columns = weeksInMonth(d);
        return ((cellSize * columns) + (cellMargin * (columns + 1))+leftMargin);
      })
      .append("g")
  
    svg.append("text")
      .attr("class", "label")
      .attr("y", (cellSize * 7) + (cellMargin * 8) + 15 )
      .attr("x", function(d) {
        var columns = weeksInMonth(d);
        return (((cellSize * columns) + (cellMargin * (columns + 1))) / 2)+leftMargin;
      })
      .attr("text-anchor", "middle")
      .text(function(d) { return monthName(d); })

    svg.append("text")
    .attr("class", "label")
    .attr("y", 15+(cellSize+cellMargin) )
    .attr("x", 10)
    .attr("text-anchor", "middle")
    .text('M')

    svg.append("text")
    .attr("class", "label")
    .attr("y", 15+(cellSize+cellMargin)*3)
    .attr("x", 10)
    .attr("text-anchor", "middle")
    .text('W')

    svg.append("text")
    .attr("class", "label")
    .attr("y", 15+(cellSize+cellMargin)*5)
    .attr("x", 10)
    .attr("text-anchor", "middle")
    .text('F')
    
    

    var rect = svg.selectAll("rect.day")
      .data(function(d, i) { return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth()+1, 1)); })
      .enter().append("rect")
      .attr("class", "day")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("rx", 3).attr("ry", 3) // rounded corners
      .attr("fill", '#eaeaea') // default light grey fill
      .attr("y", function(d) { return (day(d) * cellSize) + (day(d) * cellMargin) + cellMargin; })
      .attr("x", function(d) { return ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellSize) + ((week(d) - week(new Date(d.getFullYear(),d.getMonth(),1))) * cellMargin) + cellMargin +leftMargin; })
      .on("click", function(d) {
        d3.selectAll('.day').classed('click', false);
        d3.select(this).classed('click', true);
        let date_value = d3.select(this).data()[0];
        // console.log(date_value);
        var year_of_select = parseInt(date_value.slice(0, 4));
        var month_of_select = parseInt(date_value.slice(5, 7));
        var day_of_select = parseInt(date_value.slice(8, 10));
        // console.log(year_of_select);
        // console.log(month_of_select);
        // console.log(day_of_select);
        stacked_bar_array_driver = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Driver');
        stacked_bar_array_vehicle = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Vehicle');
        draw_stacked_bar(stacked_bar_array_driver, stacked_bar_array_vehicle);
        
        removePoint(mapsvg);
        pointdata = data.filter(d => d.Year == year_of_select).filter(d => d.Month_of_Year == month_of_select).filter(d => d.Day_of_Month == day_of_select);
        // console.log(date_value)
        drawPoint(pointdata, mapsvg, date_value);
        table_fill_values(
          {
            Datetime: year_of_select+'/'+month_of_select+'/'+day_of_select+' 00:00', 
            Region: '', 
            Road_Type: '', 
            Weather: '', 
            Age_of_Dirver: '', 
            Age_of_Vehicle: '', 
            Vehicle_Category: '',
            Accident_Severity: ''
          }
        );
      })
      .on('mouseover', function(d){
        d3.select(this).classed('hover', true);
      })
      .on("mouseout", function(d) {
        d3.select(this).classed('hover', false);
      })
      .datum(format);
  
    rect.append("title")
      .text(function(d) { return titleFormat(new Date(d)); });
  
    var lookup = d3.nest()
      .key(function(d) { return d.day; })
      .rollup(function(leaves) {
        return d3.sum(leaves, function(d){ return parseInt(d.count); });
      })
      .object(dateData);
  
    var scale = d3.scaleLinear()
      .domain(d3.extent(dateData, function(d) { return parseInt(d.count); }))
      .range([0.15,1]); // the interpolate used for color expects a number in the range [0,1] but i don't want the lightest part of the color scheme
  
    rect.filter(function(d) { return d in lookup; })
      .style("fill", function(d) { return d3.interpolatePuBu(scale(lookup[d])); })
      .select("title")
      .text(function(d) { return titleFormat(new Date(d)) + ":  " + lookup[d]; });
  
}

function draw_stacked_bar(driver_set, vehicle_set){
  document.getElementById('stacked_bar').innerHTML = '';
  let svg = d3.select('#stacked_bar')
    .attr("width", bar_width + bar_margin.left + bar_margin.right)
    .attr("height", bar_height + bar_margin.top + bar_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + bar_margin.left + "," + bar_margin.top + ")");
  
  // driver
  let driver_col = Object.keys(driver_set[0]);
  // console.log(driver_set);
  let driver_series = d3.stack().keys(driver_col.slice(1))(driver_set).map(d => (d.forEach(v => v.key = d.key), d));
  // console.log(driver_series);
  let driver_x = d3.scaleBand()
    .domain(driver_set.map(d => d.name))
    .range([0, (bar_width-interval)/2])
    .padding(0.1);
  let driver_y = d3.scaleLinear()
    .domain([0, 65])
    // .domain([0, d3.max(driver_series, d => d3.max(d, d => d[1]))])
    .rangeRound([bar_height, 0]);
  let driver_color = d3.scaleOrdinal()
    .domain(driver_series.map(d => d.key))
    // .range(['#98bcf9', '#0f64f2']);
    .range(['#2F2FA2', '#F64C72']);
  let driver_xAxis = g => g
    .attr("transform", `translate(0,${bar_height})`)
    .call(d3.axisBottom(driver_x).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove())
  let driver_yAxis = g => g
    .call(d3.axisLeft(driver_y).ticks(null, "s"))
    .call(g => g.selectAll(".domain").remove())
  let formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

  svg.append("g")
    .selectAll("g")
    .data(driver_series)
    .enter().append("g")
      .attr("fill", d => driver_color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", (d, i) => driver_x(d.data.name))
      .attr("y", d => driver_y(d[1]))
      .attr("height", d => driver_y(d[0]) - driver_y(d[1]))
      .attr("width", driver_x.bandwidth())
    .append("title")
      .text(d => `${d.data.name} ${d.key} ${formatValue(d.data[d.key])}`);
  svg.append("g")
      .call(driver_xAxis);
  svg.append("g")
      .call(driver_yAxis);
  svg.append('g')
      .append('text')
      .attr('class', 'label')
      .attr('x', -30)
      .attr('y', -15)
      .text('Numbers of Accidents');
  svg.append('g')
      .append('text')
      .attr('class', 'label')
      .attr('x', (bar_width-interval)/4)
      .attr('y', bar_height+35)
      .attr('text-anchor', 'middle')
      .text("Age of Driver");

  svg.append('text')
      .attr('x', 0)
      .attr('y', bar_height+50)
      .text('**1~2: Adolescent; 3~4: Young; 5~6: Adult; 7~8: Elderly')
      .style('font-style', 'italic');

  // vehicle
  let vehicle_col = Object.keys(vehicle_set[0])
  let vehicle_series = d3.stack().keys(vehicle_col.slice(1))(vehicle_set).map(d => (d.forEach(v => v.key = d.key), d));
  let vehicle_x = d3.scaleBand()
    .domain(vehicle_set.map(d => d.name))
    .range([(bar_width+interval)/2, bar_width])
    .padding(0.1);
  let vehicle_y = d3.scaleLinear()
    .domain([0, 30])
    // .domain([0, d3.max(vehicle_series, d => d3.max(d, d => d[1]))])
    .rangeRound([bar_height, 0]);
  let vehicle_color = d3.scaleOrdinal()
    .domain(vehicle_series.map(d => d.key))
    // .range(['#98bcf9', '#0f64f2']);
    .range(['#2F2FA2', '#F64C72']);
  let vehicle_xAxis = g => g
    .attr("transform", `translate(${0},${bar_height})`)
    .call(d3.axisBottom(vehicle_x).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove())
  let vehicle_yAxis = g => g
    .attr("transform", `translate(${(bar_width+interval)/2},0)`)
    .call(d3.axisLeft(vehicle_y).ticks(null, "s"))
    .call(g => g.selectAll(".domain").remove())
  // let formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

  svg.append("g")
    .selectAll("g")
    .data(vehicle_series)
    .enter().append("g")
      .attr("fill", d => vehicle_color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
      .attr("x", (d, i) => vehicle_x(d.data.name))
      .attr("y", d => vehicle_y(d[1]))
      .attr("height", d => vehicle_y(d[0]) - vehicle_y(d[1]))
      .attr("width", vehicle_x.bandwidth())
    .append("title")
      .text(d => `${d.data.name} ${d.key} ${formatValue(d.data[d.key])}`);
  svg.append("g")
      .call(vehicle_xAxis);
  svg.append("g")
      .call(vehicle_yAxis);
  svg.append('g')
      .append('text')
      .attr('class', 'label')
      .attr('x', (bar_width+interval)/2-30)
      .attr('y', -15)
      .text('Numbers of Accidents');
  svg.append('g')
      .append('text')
      .attr('class', 'label')
      .attr('x', (bar_width+interval)/2+(bar_width-interval)/4)
      .attr('y', bar_height+35)
      .attr('text-anchor', 'middle')
      .text("Age of Vehicle");

  // legend
  svg.append("g")
      .attr("class", "legendLinear")
      .attr("transform", "translate("+(bar_width+interval-200)+", 0)");
  let legend = d3.legendColor()
      .shapeWidth(30)
      .shapePadding(5)
      .orient('verticle')
      .scale(vehicle_color);
  svg.select(".legendLinear")
      .call(legend);

}

function filter_dataset(dataset, year, month, day, var1){
  let data_date = dataset.filter(d => d.Year == year).filter(d => d.Month_of_Year == month).filter(d => d.Day_of_Month == day);
  // console.log(data_date);
  let stacked_bar_array_name = unique(data_date.map(d => d[var1]));
  // console.log(stacked_bar_array_name);
  stacked_bar_array_name.sort((a, b) => a - b);
  // console.log(stacked_bar_array_name);
  let stacked_bar_array = [];
  for(let i=0; i<stacked_bar_array_name.length; i++){
    let temp = data_date.filter(d => d[var1] == stacked_bar_array_name[i]);
    let obj = {name: stacked_bar_array_name[i], Slight: temp.filter(d => d.Accident_Severity == 'Slight').length, Fatal_Serious: temp.filter(d => d.Accident_Severity == 'Fatal_Serious').length};
    stacked_bar_array.push(obj);
  };
  // console.log(stacked_bar_array);
  return stacked_bar_array
}

function unique(arr){
  return Array.from(new Set(arr))
}

function drawPoint(posData, svg, date){
  // console.log(posData)
  // console.log(date)
  var width = 580,
  height = 580;
  var projection = d3.geoAlbers()
  .center([0, 55.4])
  .rotate([4.4, 0])
  .parallels([50, 60])
  .scale(1200 * 2.5)
  .translate([width / 2, height / 2]);
  var path = d3.geoPath()
  .projection(projection)
  .pointRadius(2);
  svg.append('text')
  .attr('id', 'date_text')
  .text(date)
  .attr('x', '150')
  .attr('y', '40')
  .attr("text-anchor", 'middle')
  .style("font-size", "25px")
  // console.log(posData.length)
  let slight = 0
  for (var i = 0; i < posData.length; i++){
    let item = posData[i]
    if (item.Accident_Severity == "Slight"){
      slight++
    }}
  // console.log(slight)
  svg.append('text')
  .attr('id', 'date_text')
  .text(slight+" slight cases")
  .style('fill', '#2F2FA2')
  .attr('x', '150')
  .attr('y', '80')
  .attr("text-anchor", 'middle')
  .style("font-size", "25px")

  let fatal = posData.length - slight;
  svg.append('text')
  .attr('id', 'date_text')
  .text(fatal+" fatal cases")
  .style('fill', '#F64C72')
  .attr('x', '150')
  .attr('y', '110')
  .attr("text-anchor", 'middle')
  .style("font-size", "25px")

  // console.log(date)
  // var svg = d3.select("body").append("svg")
  // .attr("width", width)
  // .attr("height", height);
  // console.log(projection([-0.178376,51.492045]))
// const aa = 51.492045
// const bb = -0.178376

  svg.selectAll("dot")
  .data(posData)
  .enter().append("circle")
  .style("fill", function(d) {return pointColor(d.Accident_Severity);})
  .attr("r", 3.5)
  .attr("transform", function(d) {return "translate(" + projection([+d.Longitude,+d.Latitude]) + ")";})
  .on('mouseover', function(d){
    d3.select(this).raise().transition().duration(100).style('stroke', 'black').style('stroke-width', '2px').attr('r', '7');
    // console.log(d);
    table_fill_values(d);
  })
  .on('mouseout', function(d){
    d3.select(this).transition().duration(100).style('stroke', 'none').attr('r', '3.5');
  });
}

function pointColor(s){
  // console.log(s)
  if (s=="Slight"){
    return '#2F2FA2';
  }
  return '#F64C72'
}


function removePoint(svg){
  svg.selectAll("circle").remove();
  svg.selectAll('#date_text').remove();
}

function drawMap(){
  var width = 580,
  height = 580;

  var projection = d3.geoAlbers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(1200 * 2.5)
    .translate([width / 2, height / 2]);

  var path = d3.geoPath()
    .projection(projection)
    .pointRadius(2);

  // var svg = d3.select("body").append("svg")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("id", 'map');

  let svg = d3.select('#map')
      .attr("width", width)
      .attr("height", height)

  d3.json("uk.json", function(error, uk) {
  var subunits = topojson.feature(uk, uk.objects.subunits),
      places = topojson.feature(uk, uk.objects.places);

  svg.selectAll(".subunit")
      .data(subunits.features)
    .enter().append("path")
      .attr("class", function(d) { return "subunit " + d.id; })
      .attr("d", path);

  svg.append("path")
      .datum(topojson.mesh(uk, uk.objects.subunits, function(a, b) { return a !== b && a.id !== "IRL"; }))
      .attr("d", path)
      .attr("class", "subunit-boundary");

  svg.append("path")
      .datum(topojson.mesh(uk, uk.objects.subunits, function(a, b) { return a === b && a.id === "IRL"; }))
      .attr("d", path)
      .attr("class", "subunit-boundary IRL");

  svg.selectAll(".subunit-label")
      .data(subunits.features)
    .enter().append("text")
      .attr("class", function(d) { return "subunit-label " + d.id; })
      .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .text(function(d) { return d.properties.name; });

  svg.append("path")
      .datum(places)
      .attr("d", path)
      .attr("class", "place");

  svg.selectAll(".place-label")
      .data(places.features)
    .enter().append("text")
      .attr("class", "place-label")
      .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
      .attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
      .attr("dy", ".35em")
      .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; })
      .text(function(d) { return d.properties.name; });
  });
  d3.csv("data.csv", function(data){
  let date_value = '2010-01-01'
  var year_of_select = parseInt(date_value.slice(0, 4));
  var month_of_select = parseInt(date_value.slice(5, 7));
  var day_of_select = parseInt(date_value.slice(8, 10));
  pointdata = data.filter(d => d.Year == year_of_select).filter(d => d.Month_of_Year == month_of_select).filter(d => d.Day_of_Month == day_of_select);
  drawPoint(pointdata, svg, '2010-01-01');
  })
  // console.log(projection([-0.178376,51.492045]))
  // const aa = 51.492045
  // const bb = -0.178376
  // svg.append("circle")
  //     .attr('class', 'case-point')
  // 		.attr("r", "80")
  //     .attr("transform", function() {return "translate(" + projection([-0.178376,51.492045]) + ")";})
  //     .attr('fill', 'red')
  // console.log(svg)
  return svg
}

function draw_table(date){
  let table = d3.select('#table')
    .attr("width", table_width)
    .attr("height", table_height);

  let header = table.append("thead").append("tr");
  header.selectAll("th")
        .data(["Date", "Region", "Road Type", "Weather", 'Age of Driver', 'Age of Vehicle', 'Vehicle Category', 'Sevirity'])
        .enter()
        .append("th")
        .text(function(d) { return d; });
  let tablebody = table.append("tbody");
  row = tablebody.append("tr").attr('id', 'table_row');
  cells = row.selectAll("td")
        .data([date, '','','','','','',''])
        .enter()
        .append('td')
        .text(d=>d);
}

function table_fill_values(data){
  d3.select('#table_row').remove();
  row = d3.select('tbody').append('tr').attr('id', 'table_row');
  cells = row.selectAll("td")
    .data([data.Datetime.slice(0,-6), data.Region, data.Road_Type, data.Weather, data.Age_of_Driver, data.Age_of_Vehicle, data.Vehicle_Category, data.Accident_Severity])
    .enter()
    .append('td')
    .text(d=>d);
}

d3.csv("dates.csv", function(dates){
  d3.csv("data.csv", function(data){
    
    let slider = d3.select('#rangeInput');
    let text = d3.select('#amount');
    mapsvg = drawMap();
    drawCalendar(dates, 2010, data, mapsvg)
    
    let current = d3.select('.day');
    
    current.classed('click', true);

    let date_value = current.data()[0];
    var year_of_select = parseInt(date_value.slice(0, 4));
    var month_of_select = parseInt(date_value.slice(5, 7));
    var day_of_select = parseInt(date_value.slice(8, 10));
    stacked_bar_array_driver = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Driver');
    stacked_bar_array_vehicle = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Vehicle');
    draw_stacked_bar(stacked_bar_array_driver, stacked_bar_array_vehicle);
    // pointdata = data.filter(d => d.Year == year_of_select).filter(d => d.Month_of_Year == month_of_select).filter(d => d.Day_of_Month == day_of_select);
    // console.log(date_value)
    // drawPoint(pointdata, mapsvg, date_value)
    
    // stacked bar
    // let year_of_select = 2010
    // var month_of_select = 1
    // var day_of_select = 1
    // stacked_bar_array_driver = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Driver');
    // stacked_bar_array_vehicle = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Vehicle');
    // draw_stacked_bar(stacked_bar_array_driver, stacked_bar_array_vehicle);

    // table
    draw_table('2010/1/1');
    
    slider.on('change', function() {
        removePoint(mapsvg);
        drawCalendar(dates, this.value, data, mapsvg);
        let current = d3.select('.day');
        current.classed('click', true);
        let year_of_select = this.value;
        stacked_bar_array_driver = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Driver');
        stacked_bar_array_vehicle = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Vehicle');
        draw_stacked_bar(stacked_bar_array_driver, stacked_bar_array_vehicle);
        pointdata = data.filter(d => d.Year == year_of_select).filter(d => d.Month_of_Year == month_of_select).filter(d => d.Day_of_Month == day_of_select);
        // console.log(year_of_select)
        drawPoint(pointdata, mapsvg, year_of_select+'-01-01')
        table_fill_values(
          {
            Datetime: year_of_select+'/1/1 00:00', 
            Region: '', 
            Road_Type: '', 
            Weather: '', 
            Age_of_Dirver: '', 
            Age_of_Vehicle: '', 
            Vehicle_Category: '',
            Accident_Severity: ''
          }
        );
    });
    text.on('change', function() {
      removePoint(mapsvg);
      drawCalendar(dates, this.value, data, mapsvg);
      let current = d3.select('.day');
      current.classed('click', true);
      let year_of_select = this.value;
      stacked_bar_array_driver = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Driver');
      stacked_bar_array_vehicle = filter_dataset(data, year_of_select, month_of_select, day_of_select, 'Age_of_Vehicle');
      draw_stacked_bar(stacked_bar_array_driver, stacked_bar_array_vehicle);
      pointdata = data.filter(d => d.Year == year_of_select).filter(d => d.Month_of_Year == month_of_select).filter(d => d.Day_of_Month == day_of_select);
      drawPoint(pointdata, mapsvg, year_of_select+'-01-01')
      table_fill_values(
        {
          Datetime: year_of_select+'/1/1 00:00', 
          Region: '', 
          Road_Type: '', 
          Weather: '', 
          Age_of_Dirver: '', 
          Age_of_Vehicle: '', 
          Vehicle_Category: '',
          Accident_Severity: ''
        }
      );
    });
  });
})

