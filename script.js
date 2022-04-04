var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var p = [];
var d = [];
var k = 0;
var hue = 0;
var mutation_chance = 50;
var generation = 0;
var population = [];
canvas.onclick = function(event)
{
    p[k] = {
        "k": k,
        "x": event.offsetX,
        "y": event.offsetY,
        "h": hue
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawPoints();
    console.log(k, p[k].x, p[k].y, p[k].h);
    k++;
    hue = (hue + 23) % 360;
}

function connect(p1, p2)
{
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.stroke();
}

function drawNet()
{
    ctx.strokeStyle = "rgb(60, 60, 60)";
    ctx.lineWidth = .5;
    ctx.setLineDash([5, 10]);
    p.forEach((p1) => {
        p.forEach((p2) => {
            connect(p1, p2);
        })
    })
}

function drawPoints()
{
    p.forEach((point) => {
        ctx.fillStyle = "hsl(" + point.h + ", 100%, 60%)";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    })
}

function drawPath(path)
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    for (let i = 0; i < path.length - 1; i++)
    {
        let gradient = ctx.createLinearGradient(p[path[i]].x, p[path[i]].y, p[path[i + 1]].x, p[path[i + 1]].y);
        gradient.addColorStop(0, "hsl(" + p[path[i]].h + ", 100%, 60%)");
        gradient.addColorStop(1, "hsl(" + p[path[i + 1]].h + ", 100%, 60%)");
        ctx.strokeStyle = gradient;
        connect(p[path[i]], p[path[i + 1]]);
    }
    let gradient = ctx.createLinearGradient(p[path[path.length - 1]].x, p[path[path.length - 1]].y, p[path[0]].x, p[path[0]].y);
    gradient.addColorStop(0, "hsl(" + p[path[path.length - 1]].h + ", 100%, 60%)");
    gradient.addColorStop(1, "hsl(" + p[path[0]].h + ", 100%, 60%)");
    ctx.strokeStyle = gradient;
    connect(p[path[path.length - 1]], p[path[0]]);
    drawPoints();
}

function distance(p1, p2)
{
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function pathLength(path)
{
    var length = 0;
    for (let i = 0; i < path.length - 1; i++)
    {
        length += d[path[i]][path[i + 1]];
    }
    length += d[path[path.length - 1]][path[0]];
    return length;
}

function generateInitialPopulation(population_size)
{
    var initPopulation = [];
    var flag = false;
    var home = randomInt(0, p.length - 1);
    for (let i = 0; i < population_size; i++)
    {
        do
        {
            var path = [home];
            for (let j = 1; j < p.length; j++)
            {
                do
                {
                    var rnd = randomInt(0, p.length - 1);
                }
                while(path.includes(rnd));
                path[j] = rnd;
            }
            flag = false;
            initPopulation.forEach(element => {
                if(element.join() === path.join())
                {
                    flag = true;
                }
            });
        }
        while(flag);
        initPopulation[i] = path;
    }
    return initPopulation;
}

function rank(population)
{
    return (population.sort((path1, path2) => {
        return pathLength(path1) - pathLength(path2);
    }));
}

function select(population) // Рулетка
{
    var selection = [];
    var selection_size = population.length / 2;
    var sum = 0;
    for (let i = 0; i < population.length; i++)
    {
        sum += 1 / (pathLength(population[i]));
    }
    for (let i = 0; i < selection_size; i++)
    {
        var rnd = Math.random() * sum;
        var cursum = 0;
        for (let j = 0; j < population.length; j++)
        {
            cursum += 1 / (pathLength(population[j]));
            if (cursum >= rnd)
            {
                if (!selection.includes(j))
                {
                    selection.push(j);
                }
                else
                {
                    i--;
                }
                break;
            }
        }
    }
    for (let i = 0; i < selection_size; i++)
    {
        selection[i] = population[selection[i]];
    }
    return selection;
}

function cross(parent1, parent2)
{
    var child1 = [];
    var child2 = [];
    var cut = randomInt(0, p.length - 1);
    //console.log('cut: ' + cut);
    for (let i = 0; i <= cut; i++)
    {
        child1.push(parent1[i]);
        child2.push(parent2[i]);
    }
    for (let i = cut + 1; i < p.length; i++)
    {
        if (!child1.includes(parent2[i]))
        {
            child1.push(parent2[i]);
        }
        if (!child2.includes(parent1[i]))
        {
            child2.push(parent1[i]);
        }
    }
    for (let i = cut + 1; i < p.length; i++)
    {
        if (!child1.includes(parent1[i]))
        {
            child1.push(parent1[i]);
        }
        if (!child2.includes(parent2[i]))
        {
            child2.push(parent2[i]);
        }
    }
    //console.log('children: ' + child1 + ' ' + child2);
    return [child1, child2];
}

function mutate(path)
{
    if (Math.random() * 100 < mutation_chance)
    {
        var i = randomInt(1, path.length - 1);
        do
        {
            var j = randomInt(1, path.length - 1);
        }
        while (i == j);
        [path[i], path[j]] = [path[j], path[i]];
    }
    return path;
}

function nextGeneration()
{
    if (generation == 0)
    {
        for (let i = 0; i < p.length; i++)
        {
            d[i] = [];
            for (let j = 0; j < p.length; j++)
            {
                d[i][j] = distance(p[i], p[j]);
            }
        }
        if (p.length < 4)
        {
            population_size = 1;
        }
        else if (p.length == 4)
        {
            population_size = 4;
        }
        else
        {
            population_size = 8;
        }
        population = generateInitialPopulation(population_size);
    }
    else
    {
        var length = population.length;
        var pool = select(population);
        while (pool.length > 0)
        {
            var i = randomInt(0, pool.length - 1);
            do
            {
                var j = randomInt(0, pool.length - 1);
            }
            while (i == j);
            //console.log('pool: ' + pool);
            //console.log('i: ' + i + ', j: ' + j);
            var parent1 = pool.splice(i, 1)[0];
            var parent2 = pool.splice(i < j ? j - 1 : j, 1)[0];
            //console.log('parents: ' + parent1 + ' ' + parent2);
            var children = cross(parent1, parent2);
            //console.log(children);
            children[0] = mutate(children[0]);
            children[1] = mutate(children[1]);
            population.push(children[0]);
            population.push(children[1]);
            //console.log('child1: ' + children[0]);
            //console.log('child2: ' + children[1]);
        }
        population = rank(population);
        population.splice(length, population.length - length);
    }
    population = rank(population);
    drawPath(population[0]);
    console.log('generation ' + generation + ':');
    for (let i = 0; i < population.length; i++)
    {
        console.log(i + '. ' + population[i] + ' - ' + pathLength(population[i]));
    }
    generation++;
}

function randomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
function geneticAlgorithm()
{
    for (let i = 0; i < p.length; i++)
    {
        d[i] = [];
        for (let j = 0; j < p.length; j++)
        {
            d[i][j] = distance(p[i], p[j]);
        }
    }
    var population = generateInitialPopulation(p.length - 1);
    population = rank(population);
    population.forEach(e => console.log(e, pathLength(e)));
    console.log(population);
    drawPath(population[0]);
    //console.log(cross(initPopulation[0], initPopulation[1]));
    console.log(mutate(population[0]));
    var length = population.length;
    for (let generation = 0; generation < max_generations; generation++)
    {
        var pool = select(population);
        while (pool.length > 0)
        {
            var i = randomInt(0, pool.length - 1);
            do
            {
                var j = randomInt(0, pool.length - 1);
            }
            while (i == j);
            population.concat(cross(pool.splice(i, 1), pool.splice(j, 1)).forEach(child => mutate(child)));
        }
        population = rank(population);
        population.splice(length, population.length - length);
    }
    return population[0];
}
*/