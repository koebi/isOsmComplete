// @ts-nocheck
import React from 'react';
import * as d3 from 'd3';
import { GraphData } from './downloadGraphData';

function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

export default function draw_chronology_chart(
    uncleanData: GraphData[],
    goal = 0
): React.ReactNode {
    console.log(uncleanData)
    const w = 900;
    const h = 400;
    const margin = { top: 10, right: 15, bottom: 60, left: 80 };

    uncleanData.push({ date: tomorrow(), value: d3.max(uncleanData, (d) => d.value) });

    const data = uncleanData.map((d) => ({
        ...d,
        date: new Date(d.date)
    }));

    const t0 = data[0].date;
    const t1 = data[data.length - 1].date;

    const max = Math.max(d3.max(data, (d) => d.value), goal);

    const scale_x = d3.scaleTime()
        .domain([t0, t1])
        .range([0, w]);

    const axis_x = d3.axisBottom(scale_x)
        .tickFormat(d3.timeFormat('%b %Y'));

    const scale_y = d3.scaleLinear()
        .domain([0, max])
        .range([h, 0]);

    const line = d3.line().curve(d3.curveStepAfter)
        .x((d) => scale_x(d.date))
        .y((d) => scale_y(d.value));

    // d3.select('#chart-chronology svg').remove();

    const container = document.createElement('div');

    const chart = d3.select(container).append('svg')
        .attr('width', w + margin.left + margin.right)
        .attr('height', h + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .call((c) => {
            c.append('rect')
                .attr('width', w + 10)
                .attr('height', h + 10)
                .attr('x', -5)
                .attr('y', -5)
                .style('fill', 'white')
                .style('stroke', '#d0d0c8');
        });

    chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${h + 5})`)
        .call(axis_x);

    chart.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(-5, 0)')
        .call(d3.axisLeft(scale_y));

    chart.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#083e76')
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line);

    if (goal !== 0) {
        chart.append('line')
            .style('stroke', 'green')
            .attr('x1', scale_x(data[0].date))
            .attr('y1', scale_y(goal))
            .attr('x2', scale_x(new Date(tomorrow())))
            .attr('y2', scale_y(goal));
    }
    // eslint-disable-next-line react/no-danger
    return <div dangerouslySetInnerHTML={{ __html: container.outerHTML }} />;
}
