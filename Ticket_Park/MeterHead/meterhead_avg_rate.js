d3.csv("parking-meters_PowerQueryTrans.csv").then(data => {
    // Columns that contribute to rate
    const rateCols = [
      'R_MF_9A_6P', 'R_MF_6P_10', 'R_SA_9A_6P', 'R_SA_6P_10',
      'R_SU_9A_6P', 'R_SU_6P_10', 'RATE_MISC'
    ];
  
    // Calculate total rate per row
    data.forEach(d => {
      d.Total_Rate = rateCols.reduce((sum, col) => sum + parseFloat(d[col] || 0), 0);
    });
  
    // Group and average by METERHEAD
    const meterGroup = d3.rollup(
      data,
      v => d3.mean(v, d => d.Total_Rate),
      d => d.METERHEAD
    );
  
    // Convert Map to sorted array
    const avgRates = Array.from(meterGroup, ([METERHEAD, AvgRate]) => ({ METERHEAD, AvgRate }))
      .sort((a, b) => b.AvgRate - a.AvgRate);
  
    // D3 Chart Setup
    const svg = d3.select("#barChart"),
          width = +svg.attr("width"),
          height = +svg.attr("height"),
          margin = { top: 40, right: 20, bottom: 100, left: 60 };
  
    const x = d3.scaleBand()
      .domain(avgRates.map(d => d.METERHEAD))
      .range([margin.left, width - margin.right])
      .padding(0.3);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(avgRates, d => d.AvgRate)])
      .nice()
      .range([height - margin.bottom, margin.top]);
  
    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");
  
    // Y Axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
  
    // Bars
    svg.selectAll(".bar")
      .data(avgRates)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.METERHEAD))
      .attr("y", d => y(d.AvgRate))
      .attr("height", d => y(0) - y(d.AvgRate))
      .attr("width", x.bandwidth());
  
    // Y Axis Label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("dy", "-1.5em")
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Average Total Rate ($)");
  
    // Chart Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Average Total Parking Rate by Meterhead Type");
  });  