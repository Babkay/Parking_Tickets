const margin = { top: 50, right: 30, bottom: 50, left: 60 };

const container = d3.select("#chart");
const svgEl = container.append("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", `0 0 850 420`)
  .classed("responsive-svg", true);

const svg = svgEl.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
const legendContainer = d3.select("#legend");

const timePeriods = [
  { key: "R_MF_9A_6P", label: "Mon–Fri AM" },
  { key: "R_MF_6P_10", label: "Mon–Fri PM" },
  { key: "R_SA_9A_6P", label: "Sat AM" },
  { key: "R_SA_6P_10", label: "Sat PM" },
  { key: "R_SU_9A_6P", label: "Sun AM" },
  { key: "R_SU_6P_10", label: "Sun PM" }
];

const modal = document.getElementById("instructionModal");
const btn = document.getElementById("openModalBtn");
const span = document.querySelector(".close");

btn.onclick = () => modal.style.display = "block";
span.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target == modal) modal.style.display = "none"; }

let width = 850 - margin.left - margin.right;
let height = 420 - margin.top - margin.bottom;

const x = d3.scalePoint()
  .domain(timePeriods.map(d => d.label))
  .range([0, width])
  .padding(0.5);

const y = d3.scaleLinear().range([height, 0]);

const line = d3.line()
  .curve(d3.curveMonotoneX)
  .x(d => x(d.label))
  .y(d => y(d.rate));

const xAxisGroup = svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${height})`);

const yAxisGroup = svg.append("g").attr("class", "y-axis");

const xLabel = svg.append("text")
  .attr("x", width / 2)
  .attr("y", height + 40)
  .attr("text-anchor", "middle")
  .attr("class", "axis-label")
  .text("Day and Time");

const yLabel = svg.append("text")
  .attr("x", -height / 2)
  .attr("y", -40)
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .attr("class", "axis-label")
  .text("Average Rate ($)");

d3.csv("parking-meters_PowerQueryTrans-J.csv").then(data => {
  const allAreas = Array.from(new Set(data.map(d => d["Geo Local Area"]))).sort();
  allAreas.unshift("All Areas");

  const color = d3.scaleOrdinal()
    .domain(allAreas)
    .range(d3.schemeCategory10.concat(d3.schemeSet3));

  d3.select("#areaSelect")
    .selectAll("option")
    .data(allAreas)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  function update(area) {
    let areaData = [];

    if (area === "All Areas") {
      areaData = Array.from(
        d3.group(data, d => d["Geo Local Area"]),
        ([key, values]) => ({
          area: key,
          values: timePeriods.map(p => ({
            label: p.label,
            rate: d3.mean(values, d => +d[p.key] || 0)
          }))
        })
      );
    } else {
      const filtered = data.filter(d => d["Geo Local Area"] === area);
      areaData = [{
        area,
        values: timePeriods.map(p => ({
          label: p.label,
          rate: d3.mean(filtered, d => +d[p.key] || 0)
        }))
      }];
    }

    y.domain([0, d3.max(areaData.flatMap(d => d.values.map(v => v.rate)))]).nice();

    xAxisGroup.transition().duration(500).call(d3.axisBottom(x));
    yAxisGroup.transition().duration(500).call(d3.axisLeft(y));

    svg.select(".x-axis").attr("transform", `translate(0, ${height})`);
    xLabel.attr("x", width / 2).attr("y", height + 40);
    yLabel.attr("x", -height / 2).attr("y", -40);

    const lines = svg.selectAll(".line").data(areaData, d => d.area);

    lines.join(
      enter => enter.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d.area))
        .attr("stroke-width", 2)
        .attr("d", d => line(d.values))
        .on("mouseover", function (event, d) {
          d3.select(this)
            .raise()
            .classed("glow", true)
            .transition().duration(200)
            .attr("stroke-width", 4);
        })
        .on("mouseout", function () {
          d3.select(this)
            .classed("glow", false)
            .transition().duration(200)
            .attr("stroke-width", 2);
        }),
      update => update
        .transition().duration(500)
        .attr("stroke", d => color(d.area))
        .attr("d", d => line(d.values)),
      exit => exit.remove()
    );

    const circles = svg.selectAll(".circle-group").data(areaData, d => d.area);

    circles.join(
      enter => {
        const g = enter.append("g").attr("class", "circle-group");
        g.selectAll("circle")
          .data(d => d.values.map(v => ({ ...v, area: d.area })))
          .enter()
          .append("circle")
          .attr("r", 4)
          .attr("cx", d => x(d.label))
          .attr("cy", d => y(d.rate))
          .attr("fill", d => color(d.area))
          .on("mouseover", function (event, d) {
            tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px")
              .html(`<strong>${d.area}</strong><br>${d.label}<br>$${d.rate.toFixed(2)}`)
              .classed("hidden", false);
            d3.select(this).attr("r", 6).attr("fill", "orange");
          })
          .on("mouseout", function (event, d) {
            tooltip.classed("hidden", true);
            d3.select(this).attr("r", 4).attr("fill", color(d.area));
          });
      },
      update => update.selectAll("circle")
        .data(d => d.values.map(v => ({ ...v, area: d.area })))
        .join("circle")
        .transition()
        .attr("cx", d => x(d.label))
        .attr("cy", d => y(d.rate))
        .attr("fill", d => color(d.area)),
      exit => exit.remove()
    );

    legendContainer.html("");
    if (area === "All Areas") {
      areaData.forEach(d => {
        legendContainer.append("div")
          .attr("class", "legend-item")
          .html(`<span class="legend-color" style="background-color:${color(d.area)}"></span>${d.area}`);
      });
    }
  }

  update("All Areas");
  d3.select("#areaSelect").on("change", function () {
    update(this.value);
  });
});
