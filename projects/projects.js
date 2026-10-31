import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `${projects?.length ?? 0} Projects`;
}

// Both filters live here so each one can respect the other.
// The selected wedge is stored by year (not index), because the indices
// shift whenever the search changes which years are in the pie.
let query = '';
let selectedYear = null;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(['#B9B8FF', '#73C2FB', '#F9DC5C', '#A9E3BF']);

function matchesQuery(project) {
  let values = Object.values(project).join('\n').toLowerCase();
  return values.includes(query.toLowerCase());
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  rolledData.sort((a, b) => d3.ascending(a[0], b[0]));

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value).sort(null);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', data[i].label === selectedYear ? 'selected' : null)
      .on('click', () => selectYear(data[i].label));
  });

  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectYear(d.label));
  });
}

function selectYear(year) {
  selectedYear = selectedYear === year ? null : year;
  update();
}

function update() {
  // The pie shows every year that matches the search, so you can still
  // switch between years; the list applies both filters.
  let searchedProjects = projects.filter(matchesQuery);

  if (!searchedProjects.some((p) => p.year === selectedYear)) {
    selectedYear = null;
  }

  let visibleProjects =
    selectedYear === null
      ? searchedProjects
      : searchedProjects.filter((p) => p.year === selectedYear);

  renderProjects(visibleProjects, projectsContainer, 'h2');
  renderPieChart(searchedProjects);
}

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});

update();
