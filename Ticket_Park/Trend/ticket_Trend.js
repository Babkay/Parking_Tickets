const svg = d3.select("#rateTrendChart"),
      margin = { top: 60, right: 30, bottom: 60, left: 60 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Define time slots
const timeSlots = [
  { key: "R_MF_9A_6P", label: "Weekday 9AM–6PM" },
  { key: "R_MF_6P_10", label: "Weekday 6PM–10PM" },
  { key: "R_SA_9A_6P", label: "Saturday 9AM–6PM" },
  { key: "R_SA_6P_10", label: "Saturday 6PM–10PM" },
  { key: "R_SU_9A_6P", label: "Sunday 9AM–6PM" },
  { key: "R_SU_6P_10", label: "Sunday 6PM–10PM" }
];

// Load CSV
d3.csv("parking-meters_PowerQueryTrans.csv").then(data => {
  // Convert rate fields to float
  data.forEach(d => {
    timeSlots.forEach(slot => {
      d[slot.key] = parseFloat(d[slot.key]);
    });
  });

  // Structure data for each time slot
  const seriesData = timeSlots.map(slot => {
    return {
      name: slot.label,
      values: data.map((d, i) => ({
        meter: d.METERID,
        rate: d[slot.key],
        index: i
      }))
    };
  });

  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([
      0,
      d3.max(seriesData, s => d3.max(s.values, v => v.rate))
    ])
    .nice()
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(10));

  g.append("g")
    .call(d3.axisLeft(yScale));

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.index))
    .y(d => yScale(d.rate));

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(seriesData.map(s => s.name))
    .range(d3.schemeCategory10);

  // Draw lines
  seriesData.forEach(series => {
    g.append("path")
      .datum(series.values)
      .attr("fill", "none")
      .attr("stroke", color(series.name))
      .attr("stroke-width", 2)
      .attr("d", line);
  });

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left}, 20)`);

  seriesData.forEach((series, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(${i * 140}, 0)`);

    legendRow.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color(series.name));

    legendRow.append("text")
      .attr("x", 15)
      .attr("y", 10)
      .text(series.name)
      .attr("font-size", "12px")
      .attr("fill", "#333");
  });
});
