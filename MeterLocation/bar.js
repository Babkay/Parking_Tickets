d3.csv("parking-meters_PowerQueryTrans.csv").then(data => {
    data.forEach(d => {
      d.Avg_Weekday_Rate = +d.Avg_Weekday_Rate;
      d.Avg_Weekend_Rate = +d.Avg_Weekend_Rate;
    });
  
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const container = d3.select("#chart");
    const containerWidth = container.node().clientWidth;
    const containerHeight = containerWidth * 0.6;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
  
    const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
  
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  
    const weekdayColor = "#2E7D32";
    const weekendColor = "#FFB74D";
  
    const x = d3.scaleBand().padding(0.2).range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
  
    chartGroup.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
    chartGroup.append("g").attr("class", "y-axis");
  
    // Tooltip function
    function tooltipHTML(d) {
      return `<strong>${d["Geo Local Area"]}</strong><br>
              Weekday Rate: $${d.Avg_Weekday_Rate.toFixed(2)}<br>
              Weekend Rate: $${d.Avg_Weekend_Rate.toFixed(2)}`;
    }
  
    function updateChart(filteredData) {
      x.domain(filteredData.map(d => d["Geo Local Area"]));
      y.domain([0, d3.max(filteredData, d => Math.max(d.Avg_Weekday_Rate, d.Avg_Weekend_Rate))]).nice();
  
      svg.select(".x-axis")
        .transition().duration(600)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end");
  
      svg.select(".y-axis")
        .transition().duration(600)
        .call(d3.axisLeft(y));
  
      const bars = chartGroup.selectAll(".bar-group")
        .data(filteredData, d => d["Geo Local Area"]);
  
      // EXIT
      bars.exit().remove();
  
      // ENTER
      const barEnter = bars.enter().append("g").attr("class", "bar-group");
  
      barEnter.append("rect")
        .attr("class", "bar-weekday")
        .attr("x", d => x(d["Geo Local Area"]))
        .attr("width", x.bandwidth() / 2)
        .attr("y", d => y(d.Avg_Weekday_Rate))
        .attr("height", d => height - y(d.Avg_Weekday_Rate))
        .attr("fill", weekdayColor)
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(tooltipHTML(d))
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
          d3.select(this).attr("fill", "#2196F3");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).attr("fill", weekdayColor);
        });
  
      barEnter.append("rect")
        .attr("class", "bar-weekend")
        .attr("x", d => x(d["Geo Local Area"]) + x.bandwidth() / 2)
        .attr("width", x.bandwidth() / 2)
        .attr("y", d => y(d.Avg_Weekend_Rate))
        .attr("height", d => height - y(d.Avg_Weekend_Rate))
        .attr("fill", weekendColor)
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(tooltipHTML(d))
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
          d3.select(this).attr("fill", "#2196F3");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
          d3.select(this).attr("fill", weekendColor);
        });
  
      // UPDATE
      bars.select(".bar-weekday")
        .transition().duration(600)
        .attr("x", d => x(d["Geo Local Area"]))
        .attr("y", d => y(d.Avg_Weekday_Rate))
        .attr("height", d => height - y(d.Avg_Weekday_Rate));
  
      bars.select(".bar-weekend")
        .transition().duration(600)
        .attr("x", d => x(d["Geo Local Area"]) + x.bandwidth() / 2)
        .attr("y", d => y(d.Avg_Weekend_Rate))
        .attr("height", d => height - y(d.Avg_Weekend_Rate));
    }
  
    // Setup dropdown
    const uniqueAreas = Array.from(new Set(data.map(d => d["Geo Local Area"]))).sort();
    const dropdown = d3.select("#areaSelect");
  
    uniqueAreas.forEach(area => {
      dropdown.append("option").attr("value", area).text(area);
    });
  
    dropdown.on("change", function () {
      const selected = this.value;
      const filtered = selected === "All" ? data : data.filter(d => d["Geo Local Area"] === selected);
      updateChart(filtered);
    });
  
    updateChart(data); // Initial load
  
    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, 20)`);
  
    legend.append("rect").attr("x", 0).attr("width", 15).attr("height", 15).attr("fill", weekdayColor);
    legend.append("text").attr("x", 20).attr("y", 12).text("Weekday Rate");
  
    legend.append("rect").attr("x", 150).attr("width", 15).attr("height", 15).attr("fill", weekendColor);
    legend.append("text").attr("x", 170).attr("y", 12).text("Weekend Rate");

    // X-axis label
    chartGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 4)
        .attr("y", height + (margin.bottom - 1))
        .text("Geo Local Area")
        .style("font-weight", "bold");

    // Y-axis label
    chartGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .text("Average Rate ($)")
        .style("font-weight", "bold");

  });
  