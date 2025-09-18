const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", "0 0 960 700") // Increased height to accommodate legend below
  .attr("preserveAspectRatio", "xMidYMid meet")
  .classed("responsive-svg", true);

// Add centered title
/*svg.append("text")
  .attr("x", 480) // Center of SVG width
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .attr("class", "map-title")
  .text("Average Weekday Parking Rates by Local Area");
*/
const tooltip = d3.select("#tooltip");

Promise.all([
  d3.json("vancouver.geojson"),
  d3.csv("parking-meters_PowerQueryTrans.csv")
]).then(([geoData, csvData]) => {
  // Step 1: Build avg rate dictionary
  const rateByArea = {};

  csvData.forEach(d => {
    const area = d["Geo Local Area"];
    if (!rateByArea[area]) {
      rateByArea[area] = { weekdayRates: [], weekendRates: [] };
    }
    rateByArea[area].weekdayRates.push(+d.Avg_Weekday_Rate);
    rateByArea[area].weekendRates.push(+d.Avg_Weekend_Rate);
  });

  // Step 2: Compute average per area
  for (const area in rateByArea) {
    const { weekdayRates, weekendRates } = rateByArea[area];
    rateByArea[area] = {
      avgWeekdayRate: d3.mean(weekdayRates),
      avgWeekendRate: d3.mean(weekendRates),
    };
  }

  const maxWeekdayRate = d3.max(Object.values(rateByArea).map(d => d.avgWeekdayRate));

  // Step 3: Add average rates to geo features
  geoData.features.forEach(feature => {
    const name = feature.properties.name;
    const rates = rateByArea[name] || { avgWeekdayRate: 0, avgWeekendRate: 0 };
    feature.properties.avgWeekdayRate = rates.avgWeekdayRate;
    feature.properties.avgWeekendRate = rates.avgWeekendRate;
  });

  // Step 4: Color scale
  const colorScale = d3.scaleQuantize()
    .domain([0, maxWeekdayRate])
    .range(d3.schemeBlues[7]);

  // Step 5: Projection and path
  const projection = d3.geoMercator()
    .fitSize([960, 600], geoData); // Keep map area at 600 height
  const path = d3.geoPath().projection(projection);

  // Step 6: Draw map
  svg.selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      const rate = d.properties.avgWeekdayRate;
      return rate ? colorScale(rate) : "#ccc";
    })
    .attr("stroke", "#fff")
    .on("mouseover", (event, d) => {
      const name = d.properties.name;
      const weekdayRate = d.properties.avgWeekdayRate.toFixed(2);
      const weekendRate = d.properties.avgWeekendRate.toFixed(2);

      d3.select(event.target).attr("fill", "green");

      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(`<strong>${name}</strong><br>
               Avg Weekday Rate: $${weekdayRate}<br>
               Avg Weekend Rate: $${weekendRate}`)
        .classed("hidden", false);
    })
    .on("mouseout", (event, d) => {
      const rate = d.properties.avgWeekdayRate;
      d3.select(event.target).attr("fill", rate ? colorScale(rate) : "#ccc");
      tooltip.classed("hidden", true);
    });

  // Step 7: Add legend BELOW the map
  const legendWidth = 300;
  const legendHeight = 20;
  const legendTopMargin = 620; // Position below the map (600 height + 20 margin)

  const legend = svg.append("g")
    .attr("transform", `translate(${(960 - legendWidth) / 2},${legendTopMargin})`); // Centered horizontally

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickSize(legendHeight)
    .ticks(6)
    .tickFormat(d => d.toFixed(1)); // Format numbers with 1 decimal place

  legend.selectAll("rect")
    .data(colorScale.range().map(color => {
      const d = colorScale.invertExtent(color);
      if (!d[0]) d[0] = legendScale.domain()[0];
      if (!d[1]) d[1] = legendScale.domain()[1];
      return d;
    }))
    .join("rect")
    .attr("x", d => legendScale(d[0]))
    .attr("y", 0)
    .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
    .attr("height", legendHeight)
    .attr("fill", d => colorScale(d[0]));

  legend.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(legendAxis)
    .select(".domain")
    .remove();

  // Add legend title
  legend.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .text("Average Rate ($)");

}).catch(error => {
  console.error("Error loading data:", error);
});