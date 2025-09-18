/*
CSIS 3860 Winter 2025
Week 13 Lecture Demo - Line Chart on Historical Temperature in San Francisco
Baozhang Min
*/

/// Parking Meter Rates Line Chart
const svg = d3.select("svg"),
width = +svg.attr("width"),
height = +svg.attr("height"),
margin = { top: 60, right: 50, bottom: 80, left: 80 },
innerWidth = width - margin.left - margin.right,
innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("df_final_line.csv").then(data => {
// Parse rate as number
data.forEach(d => {
d.Rate = +d.Rate;
});

// Nest data: average rate per Time and Area
const grouped = Array.from(
d3.group(data, d => d['Geo Local Area']),
([key, values]) => ({
area: key,
values: Array.from(
  d3.group(values, v => v.Time),
  ([time, group]) => ({
    Time: time,
    Rate: d3.mean(group, d => d.Rate)
  })
).sort((a, b) => a.Time.localeCompare(b.Time))
})
);

// Get all time values (assuming consistent across groups)
const allTimes = [...new Set(data.map(d => d.Time))].sort();

const xScale = d3.scalePoint()
.domain(allTimes)
.range([0, innerWidth])
.padding(0.5);

const yScale = d3.scaleLinear()
.domain([0, d3.max(grouped, d => d3.max(d.values, v => v.Rate))])
.nice()
.range([innerHeight, 0]);

const line = d3.line()
.x(d => xScale(d.Time))
.y(d => yScale(d.Rate));

// Add line paths for each area
grouped.forEach(group => {
g.append("path")
.datum(group.values)
.attr("class", "line-path")
.attr("stroke", d3.schemeCategory10[grouped.indexOf(group) % 10])
.attr("d", line);
});

const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

g.append("g")
.call(yAxis);

g.append("g")
.call(xAxis)
.attr("transform", `translate(0, ${innerHeight})`)
.selectAll("text")
.attr("text-anchor", "end")
.attr("transform", "rotate(-45)")
.attr("dx", "-0.8em")
.attr("dy", "0.15em");

g.append("text")
.attr("class", "axis-label")
.attr("x", innerWidth / 2)
.attr("y", innerHeight + 60)
.attr("text-anchor", "middle")
.text("Time Slot");

g.append("text")
.attr("class", "axis-label")
.attr("transform", "rotate(-90)")
.attr("x", -innerHeight / 2)
.attr("y", -50)
.attr("text-anchor", "middle")
.text("Average Rate ($)");

svg.append("text")
.attr("class", "title")
.attr("x", width / 2)
.attr("y", 30)
.attr("text-anchor", "middle")
.text("Parking Rates by Time and Area");
});
