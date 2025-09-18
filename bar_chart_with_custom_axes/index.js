/*
CSIS 3860 Winter 2025
Week 13 Lecture Demo - Bar Chart with Custom Axes
Baozhang Min
*/

// This is a simple bar chart using D3.js
const svg = d3.select("svg");

// Get the width and height of the SVG element
const width = +svg.attr("width");
const height = +svg.attr("height");

// render function to create the bar chart
const render = (data) => {
  // value accessors for the x and y axes
  const xValue = (d) => d.population;
  const yValue = (d) => d.country;

  // Set the margin and inner width/height for the chart
  const margin = { top: 50, right: 40, bottom: 70, left: 200 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create the scales for the x and y axes
  const xScale = d3
    .scaleLinear() // Use scaleLinear for continuous data (population)
    .domain([0, d3.max(data, xValue)]) // Get the maximum population value
    .range([0, innerWidth]);

  const yScale = d3
    .scaleBand() // Use scaleBand for categorical data (countries)
    .domain(data.map(yValue)) // Get the country names for the y-axis
    .range([0, innerHeight])
    .padding(0.1); // Add padding between the bars

  // Create a group element to hold the entire chart
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create the x-axis tick format, 3 significant figures
  // and replace 'G' with 'B' for billions
  const xAxisTickFormat = (number) =>
    d3.format(".3s")(number).replace("G", "B");

  // Create the x-axis with custom tick format and tick size(grid lines)
  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(xAxisTickFormat)
    .tickSize(-innerHeight);

  // Create the x-axis group to hold the axis and label
  // and set its position at the bottom of the chart
  const xAxisG = g
    .append("g")
    .call(xAxis) // Call the x-axis function to create the axis under the xAxis group
    .attr("transform", `translate(0,${innerHeight})`);

  // Remove the default domain line and add a label
  xAxisG.select(".domain").remove();
  xAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", 60)
    .attr("x", innerWidth / 2)
    .attr("fill", "black")
    .text("Population");

  // Create the y-axis and remove the domain and tick lines
  g.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll(".domain, .tick line")
    .remove();

  // Create the bars for each data point and append them to the chart
  g.selectAll("rect")
    .data(data)
    .enter() // Use enter() to bind data because we are creating new elements
    .append("rect")
    .attr("y", (d) => yScale(yValue(d))) // Set the y position of each bar based on yScale
    .attr("width", (d) => xScale(xValue(d))) // Set the width of each bar based on xScale
    .attr("height", yScale.bandwidth()); // Set the height of each bar based on the scale

  // Add a title to the chart
  g.append("text")
    .attr("class", "title")
    .attr("y", -10)
    .text("Top 10 Most Populous Countries");
};

// Load the data from the CSV file and render the chart
d3.csv("population2017.csv").then((data) => {
  data.forEach((d) => (d.population = +d.population * 1000)); // Convert population to number
  render(data);
});
