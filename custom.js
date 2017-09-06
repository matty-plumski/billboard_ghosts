//***** LOAD DATA *********************************************      
var link_list = null;
d3.json('graph.json', function(error, d) {
        var data = d;

        //console.log(data.nodes[0]);
// Dummy Data for Testing
//        var data = {'nodes':[{
//        'id': '0', 'name': 'aaa', 'label':'AAA had <b>7</b> tracks in 2007-2012, peaking at 1 and surviving 165 total weeks on the charts.',  'size': 1,  'color': 'red',  'x':'0',  'y': '0', 'attributes': {'info': '<ol><li>J.R. Rotem (1)</li><li>John Hill  (1)</li><li>Justin Tranter (1)</li></ol>', 'playlist': '1GHxAmb1iZz8qYDQaDKZuW', 'weight':'4'}},
//        {'id': '1',  'name': 'bbb', 'label':'BBB had 7 tracks in 2007-2012, peaking at 1 and surviving 165 total weeks on the charts.',  'size': 15,  'color': 'red',  'x':'10', 'y': '-2', 'attributes': {'info': '<ol><li>J.R. Rotem (1)</li><li>John Hill  (1)</li><li>Justin Tranter (1)</li></ol>', 'playlist': '1GHxAmb1iZz8qYDQaDKZuW', 'weight':'4'}},
//        {'id': '2',  'name': 'ccc', 'label':'CCC had 7 tracks in 2007-2012, peaking at 1 and surviving 165 total weeks on the charts.',  'size': 8,  'color': 'red',  'x':'20', 'y': '-4', 'attributes': {'info': '<ol><li>J.R. Rotem (1)</li><li>John Hill  (1)</li><li>Justin Tranter (1)</li></ol>', 'playlist': '1GHxAmb1iZz8qYDQaDKZuW', 'weight':'4'}},
//        {'id': '3',  'name': 'ddd', 'label':'DDD had 7 tracks in 2007-2012, peaking at 1 and surviving 165 total weeks on the charts.',  'size': 10, 'color': 'red',  'x':'30', 'y': '6', 'attributes': {'info': '<ol><li>J.R. Rotem (1)</li><li>John Hill  (1)</li><li>Justin Tranter (1)</li></ol>', 'playlist': '1GHxAmb1iZz8qYDQaDKZuW', 'weight':'4'}},
//        {'id': '4',  'name': 'eee', 'label':'EEE had 7 tracks in 2007-2012, peaking at 1 and surviving 165 total weeks on the charts.',  'size': 8,  'color': 'red',  'x':'40', 'y': '-10', 'attributes': {'info': '<ol><li>J.R. Rotem (1)</li><li>John Hill  (1)</li><li>Justin Tranter (1)</li></ol>', 'playlist': '1GHxAmb1iZz8qYDQaDKZuW', 'weight':'4'}}],
//        'edges':[{'source':'0', 'color': 'gray', 'size':1.0,  'target':'1'},
//        {'source':'2', 'color': 'gray', 'size':4.0,  'target':'3'},
//        {'source':'4', 'color': 'gray', 'size':3.0,  'target':'3'},
//        {'source':'0', 'color': 'gray', 'size':7.0,  'target':'3'},
//        {'source':'2', 'color': 'gray', 'size':12.0, 'target':'3'}]};

// SVG Properties
var width  = window.innerWidth*.7; // ~2/3 of the left window for viz
var height = window.innerHeight;   // All of viz height
var zoom   = d3.behavior.zoom().scaleExtent([-10, 100]).on('zoom', zoomed); // Set zoom scale extent and zoom function behavior
var st_fnt = 6;    // Starting Font Size
var scale  = 1;    // Stores current zoom level
var h_node = null; // Node Highlight Flag
    
// Find Bounds of X&Y Coordinates, Radius and Strokes
var Xmax = d3.max(data.nodes, function(d) { return d.x; });
var Xmin = d3.min(data.nodes, function(d) { return d.x; });
var Ymax = d3.max(data.nodes, function(d) { return d.y; });
var Ymin = d3.min(data.nodes, function(d) { return d.y; });
var Rmin = d3.min(data.nodes, function(d) { return d.size; });  
var Rmax = d3.max(data.nodes, function(d) { return d.size; }); 
var Smin = d3.min(data.edges, function(d) { return d.size; });  
var Smax = d3.max(data.edges, function(d) { return d.size; });     
 
// Functions to Scale X&Y Coordinates, Radius and Strokes
var Xpos = d3.scale.linear().range([width*.1,  width*.9] ).domain([Xmin, Xmax]);
var Ypos = d3.scale.linear().range([height*.1, height*.9]).domain([Ymin, Ymax]);
var Rpos = d3.scale.linear().range([1.5, 8]).domain([Rmin, Rmax]);
var Spos = d3.scale.linear().range([.1, 2]).domain([Smin, Smax]);

// Dropdown
var dropdown = document.getElementById("select_drop")
dropdown.addEventListener('change', drop_change);
    
function drop_change() {
    set_focus(data.nodes[this.value]);
}
    
// Reset
var reset = document.getElementById("reset")
reset.addEventListener('click', drop_reset);
    
function drop_reset() {
    mouse_off();
    h_node = null;
}

var drop_opts = [];
// Scale Node Placement & Get Dropdown values
for (var i = 0; i < data.nodes.length; i++){
    data.nodes[i].x  = Xpos(Number(data.nodes[i].x));    
    data.nodes[i].y  = Ypos(Number(data.nodes[i].y));
    data.nodes[i].id = Number(data.nodes[i].id);
    drop_opts[i] = [data.nodes[i].label.split(' had ')[0] + ' ('+ data.nodes[i].attributes.weight + ')', i, data.nodes[i].attributes.weight];
}

// Sort and Fill Dropdown
drop_opts = drop_opts.sort(function(a,b){ return b[2] - a[2]; });
for (var i = 0; i < drop_opts.length; i++){
    dropdown[dropdown.length] = new Option(drop_opts[i][0], drop_opts[i][1]);
}

    
// Cast Edge Source&Target as Numeric
for (var i = 0; i < data.edges.length; i++){
    data.edges[i].source = Number(data.edges[i].source);
    data.edges[i].target = Number(data.edges[i].target);
}

// Map Edges to Node
function node_location(id, axis='x', d=data) {
    n = d.nodes.filter(function(d) { return d['id'] == String(id) })[0]
    if(axis=='x'){
        return n.x;
    } else {
        return n.y
    }
};
 
// Zoom SVG on Click/Scroll
function zoomed() {
    // Scale Window
    svg.attr('transform', 
             'translate(' + d3.event.translate + 
             ')scale(' + d3.event.scale + ')');
    scale = d3.event.scale;
    // proportionally resize text so it doesn't overlap when zoomed
    d3.selectAll("text").attr('font-size', Math.max(1, 5/scale)+'px')
}
    
//***** ADD SVG *********************************************     
// Whole window on left which allows for zoom interations
var outer = d3.select('#viz').append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(0, 0)')
        .call(zoom);
    
// Where the viz will go.
var svg = outer.append('g');
     
//***** PLOT NODES ********************************************* 
// Append all links first and add midpoint so path is curved. Pull most attributes from data.
var links = svg.selectAll('links')
               .data(data.edges)
                .enter().append('path')
                .attr('d', function(d) {
                    var dx = node_location(d.target, 'x') - node_location(d.source, 'x'),
                        dy = node_location(d.target, 'y') - node_location(d.source, 'y'),
                        dr = Math.sqrt(dx * dx + dy * dy);
                    return 'M' + node_location(d.source, 'x') + ',' + node_location(d.source, 'y') + 'A' + dr + ',' + dr + ' 0 0,1 ' + node_location(d.target, 'x') + ',' + node_location(d.target, 'y');
                    }).attr('fill', 'none')
                .attr('stroke', function(d) { return d.color; })
                .attr('stroke-width', function(d) { return Spos(d.size); });

// Append all nodes second and add the click functionality for highlighting vs. focusing.    
var node = svg.selectAll('node')
              .data(data.nodes)
              .enter().append('circle')
              .attr('class', 'node')
              .attr('fill', function(d) { return d.color; })
              .attr('cx', function(d)   { return d.x;}) 
              .attr('cy', function(d)   { return d.y;})
              .attr('r', function(d)    { return Rpos(d.size); })
              .on('mouseover', function(d) { if (h_node === null) mouse_over(d); })
              .on('click', function(d) { 
                  if (h_node === null) {
                      h_node = d;
                      set_focus(d);
                  } else {
                      mouse_off();
                      h_node = null;
                  }
              })
              .on('mouseout', function(d) { if (h_node === null) mouse_off(); });

// Pre place text sized for initial zoom.
var text = svg.selectAll('.text')
              .data(data.nodes)
              .enter().append('text')
              .attr('x', function(d)   { return d.x + 1.2;})
              .attr('y', function(d)   { return d.y - 1.2;})
              .text(function(d) { return d.label.split(' had ')[0]; })
              .attr('font-family', 'Verdana')
              .attr('id', function(d)  { return d.id;})
              .attr('font-size', Math.max(1, 5*(1/scale))+'px')
              .attr('fill', 'black')
              .attr('opacity', 0)
              .attr('pointer-events', 'none');

//***** HIGHLIGHTS ********************************************* 
var link_list = {}; // Store all start/end ids

// Populate link_list
data.edges.forEach(function(d) {
	link_list[d.source + ',' + d.target] = true;
});

// Function to test node connection
function conn_test(a, b) {
    return link_list[a.id + ',' + b.id] || link_list[b.id + ',' + a.id] || a.id == b.id;
}

// Checks for node tests
//console.log(data.nodes[4].id,data.nodes[1].id, 'test')
//console.log(link_list[data.nodes[4].id+ ',' +data.nodes[1].id] || 
//            link_list[data.nodes[1].id+ ',' +data.nodes[4].id] || 
//            data.nodes[1].id==data.nodes[4].id)
//            
//console.log(data.nodes[3].id,data.nodes[2].id, 'test')
//console.log(link_list[data.nodes[3].id+ ',' +data.nodes[2].id] || 
//            link_list[data.nodes[2].id+ ',' +data.nodes[3].id] || 
//            data.nodes[2].id==data.nodes[3].id)

function mouse_off() {
    svg.style('cursor','move');
    console.log('exit');
    document.getElementById('art_label').innerHTML = '';
    document.getElementById('playlist').innerHTML = '';
    node.attr('fill', function(d) { return d.color; })
        .style('stroke', null).attr('opacity', 1);
    text.transition()
        .style('opacity', '0');
    links.transition()
         .attr('stroke',  function(o) { return o.color;})
         .attr('opacity', 1);
}

function set_focus(d) {	
    console.log('focus');
    // Set clicked node and any connected node to visible 
    node.attr('fill',    function(o) { return conn_test(d, o) ? '#e67e22': o.color;})
        .attr('opacity', function(o) { return conn_test(d, o) ? 1: 0.1;})
        .style('stroke', function(o) { return conn_test(d, o) ? '#e67e22':  null;});
    
    links.attr('stroke',  function(o) { return o.source == d.id || o.target == d.id ? '#e67e22' : o.color;})
         .attr('opacity', function(o) { return o.source == d.id || o.target == d.id ? 1 : 0.1;});
    
    text.transition()
        .style('opacity',     function(o) { return conn_test(d, o) ? 1 : 0;});
}
    
// Rearrange labels so they don't overlap. 
// Bulk of the approach taken from: http://bl.ocks.org/larskotthoff/11406992
function arrangeLabels(d) {
    var move = 1;
    while(move > 0) {
        move = 0;
        txt = d3.selectAll("text").filter(function(o) { return conn_test(d, o) ? true: false ;})
        txt.each(function() {
            var that = this; 
            var a = this.getBoundingClientRect();
            txt.each(function() {
                if(this != that) {
                    var b = this.getBoundingClientRect();
                    if((Math.abs(a.left - b.left) * 2 < (a.width  + b.width)) &&
                       (Math.abs(a.top -  b.top)  * 2 < (a.height + b.height))) {
                        var dx = (Math.max(0, a.right - b.left) + Math.min(0, a.left - b.right)) * 0.01,
                            dy = (Math.max(0, a.bottom - b.top) + Math.min(0, a.top - b.bottom)) * 0.02,
                            tt = d3.transform(d3.select(this).attr("transform")),
                            to = d3.transform(d3.select(that).attr("transform"));
                        move += Math.abs(dx) + Math.abs(dy);
                        to.translate = [ to.translate[0] + dx, to.translate[1] + dy ];
                        tt.translate = [ tt.translate[0] - dx, tt.translate[1] - dy ];
                        d3.select(this).attr("transform", "translate(" + tt.translate + ")");
                        d3.select(that).attr("transform", "translate(" + to.translate + ")");
                        a = this.getBoundingClientRect();
                    }
                }
            });
        });
    }
}
    
function mouse_over(d) {
    console.log('highlight');
    svg.style('cursor','pointer');
    // Set infobox values
    document.getElementById('art_label').innerHTML = d.label;
    document.getElementById('playlist').innerHTML = '<iframe src="https://open.spotify.com/embed/user/hoyablues/playlist/'+d.attributes.playlist+'" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>';
    
    // Focus on Nodes
    node.attr('fill',     function(o) { return conn_test(d, o) ? '#e67e22': o.color;})
        .attr('opacity',  function(o) { return conn_test(d, o) ? 1: 0.1;})
        .style('stroke',  function(o) { return conn_test(d, o) ? '#e67e22':  null;});
    
    // Arrange the labels then make the hover node visible
    arrangeLabels(d);
    text.style('opacity', function(o) { return d.id==o.id ? 1 : 0;});
    
    // Make any connected line visible
    links.transition()
         .attr('stroke',  function(o) { return o.source == d.id || o.target == d.id ? '#e67e22' : o.color;})
         .attr('opacity', function(o) { return o.source == d.id || o.target == d.id ? 1 : 0.1;});
}
 	
    
    
// Ender    
});