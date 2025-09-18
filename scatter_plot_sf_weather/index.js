/*
CSIS 3860 Winter 2025
Week 13 Lecture Demo - Scatter Plot on Historical Temperature in San Francisco
Baozhang Min
*/

// This is a simple scatter plot using D3.js
const svg = d3.select("svg");

// Get the width and height of the SVG element
const width = +svg.attr("width");
const height = +svg.attr("height");

// A Helper function to capitalize the first letter of a string
const capFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// render function to create the scatter plot
const render = (data) => {
  // Get the headers from the data
  const headers = data.columns;

  /* header list with the following indices 
  0: "timestamp"
  1: "temperature"
  */

  //  value accessor for x and create the x-axis label
  const xValue = (d) => d.timestamp;
  const xAxisLabel = "Time";

  // value accessor for y and create the y-axis label
  const yValue = (d) => d.temperature;
  const yAxisLabel = capFirstLetter(headers[1]);

  // Create the title for the scatter plot dynamically
  const title = "Historical Temperature in San Francisco";

  // Set the margin, inner width/height and circle radius for the plot
  const margin = { top: 60, right: 40, bottom: 90, left: 150 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const circleRadius = 7;

  // Create the scales for the x and y axes
  const xScale = d3
    .scaleTime() // Use scaleTime for the x-axis since it is a time series data
    .domain(d3.extent(data, xValue)) // Get the min and max values of the x-axis data
    .range([0, innerWidth])
    .nice(); // Use nice() to avoid grid lines at the edges

  const yScale = d3
    .scaleLinear() // Use scaleLinear for continuous data on the y-axis
    .domain(d3.extent(data, yValue))
    .range([innerHeight, 0]) // Invert the range to have the origin at the bottom left corner
    .nice();

  // Create a group element to hold the entire plot
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create the x-axis with custom tick size (grid lines)
  // and tick padding so the ticks are not too close to the axis
  const xAxis = d3.axisBottom(xScale).tickSize(-innerHeight).tickPadding(15);

  // Create the x-axis group to hold the axis and label
  // and set its position at the bottom of the plot
  const xAxisG = g
    .append("g")
    .call(xAxis) // Call the x-axis function to create the axis under the xAxis group
    .attr("transform", `translate(0,${innerHeight})`);

  // Remove the default domain line and add a label
  xAxisG.select(".domain").remove();
  xAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", 75)
    .attr("x", innerWidth / 2)
    .attr("fill", "black")
    .text(xAxisLabel);

  // Similarly, create the y-axis with custom tick size (grid lines) and tick padding
  const yAxis = d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10);

  const yAxisG = g.append("g").call(yAxis); // Call the y-axis function to create the axis under the yAxis group

  // Remove the default domain line and add a label
  yAxisG.select(".domain").remove();
  yAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", -90)
    .attr("x", -innerHeight / 2) // Positions the text anchor at the middle of the Y-axis height
    .attr("fill", "black") // Explicitly set the text color to black otherwise it won't be visible
    .attr("transform", "rotate(-90)") // Rotates the text to be vertical
    .attr("text-anchor", "middle") // Centers the text horizontally around the anchor point
    .text(yAxisLabel);

  // Create the circles for each data point and append them to the chart to create the scatter plot
  g.selectAll("circle")
    .data(data)
    .enter() // Use enter() to bind data because we are creating new elements
    .append("circle")
    .attr("cy", (d) => yScale(yValue(d))) // Set the centroid's y position of each circle based on the yScale
    .attr("cx", (d) => xScale(xValue(d))) // Set the centroid's x position of each circle based on the xScale
    .attr("r", circleRadius);

  // Add a title to the scatter plot
  g.append("text").attr("class", "title").attr("y", -10).text(title);
};

// Load the data from the CSV file and render the scatter plot
d3.csv("week_temperature_sf.csv").then((data) => {
  data.forEach((d) => {
    d.temperature = +d.temperature;
    d.timestamp = new Date(d.timestamp); // Convert the timestamp to a Date object
  });
  render(data);
});
