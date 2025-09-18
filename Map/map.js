const svg = d3.select("#map")
  .append("svg")
  .attr("viewBox", `0 0 960 600`) // Add viewBox for responsiveness
  .attr("preserveAspectRatio", "xMidYMid meet") // Preserve aspect ratio when resizing
  .classed("responsive-svg", true); // Add a class for potential CSS customizations

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
    .fitSize([960, 600], geoData);
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

      // Change area color to green on hover
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
      // Reset area color after hover
      const rate = d.properties.avgWeekdayRate;
      d3.select(event.target).attr("fill", rate ? colorScale(rate) : "#ccc");
      tooltip.classed("hidden", true);
    });

  // Step 7: Add legend (same as before)
  const legendWidth = 300;
  const legendHeight = 20;

  const legend = svg.append("g")
    .attr("transform", `translate(${960 - legendWidth - 20},${600 - 50})`);

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickSize(-legendHeight)
    .ticks(6);

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
}).catch(error => {
  console.error("Error loading data:", error);
});