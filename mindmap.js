const svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

const data = {
    nodes: [
        { id: "Node 1" },
        { id: "Node 2" },
        { id: "Node 3" }
    ],
    links: [
        { source: "Node 1", target: "Node 2" },
        { source: "Node 2", target: "Node 3" }
    ]
};

const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2));

let link = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .attr("class", "link")
    .attr("stroke-width", 2);

let node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(data.nodes)
    .enter().append("circle")
    .attr("r", 10)
    .attr("fill", "orange")
    .on("click", function(event, d) {
        // Add a new node connected to the clicked node
        const newNodeId = `Node ${data.nodes.length + 1}`;
        const newNode = { id: newNodeId };
        data.nodes.push(newNode);
        data.links.push({ source: d.id, target: newNodeId });

        // Restart the simulation with the new data
        update();
    });

node.append("title")
    .text(d => d.id);

simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
});

function update() {
    // Update links
    link = link.data(data.links);
    link.exit().remove();
    link = link.enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", 2)
        .merge(link);

    // Update nodes
    node = node.data(data.nodes);
    node.exit().remove();
    node = node.enter().append("circle")
        .attr("r", 10)
        .attr("fill", "orange")
        .on("click", function(event, d) {
            const newNodeId = `Node ${data.nodes.length + 1}`;
            const newNode = { id: newNodeId };
            data.nodes.push(newNode);
            data.links.push({ source: d.id, target: newNodeId });
            update();
        })
        .merge(node)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    node.append("title")
        .text(d => d.id);

    simulation.nodes(data.nodes);
    simulation.force("link").links(data.links);
    simulation.alpha(1).restart();
} 