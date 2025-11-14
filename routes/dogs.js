import express from "express";

const dogsRouter = express.Router();

//let lstDogs = []
dogsRouterRouter.get('/', (req, res) => {
    res.json(dogs)
})

dogsRouter.get("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const dog = dogs.find(value => value.id === id);
    res.json({dog});
});

dogsRouter.post('/create', (req, res) => {
    const {name, date, duration} = req.body;
    const id = getNewID(dogs);
    const newDog={id, name, date, duration};
    dogs.push(newDog);
    const message = `Le chien ${newActivity.name} a bien été ajouté !`;
    res.json({message : message, dog : newDog});
    //res.send('new dog successfully added')
})

dogsRouter.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, date, duration } = req.body;
    const index = dogs.findIndex(dog => dog.id === id);
    dogs [index] = { id, name, date, duration };
    res.json({ message: 'dog updated', dog: dogs[index] });
});

dogsRouter.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = dogs.findIndex(dog => dog.id === id);
    //res.send(index);
    dogs.splice(index, 1);
    res.json({ message: 'Dog deleted' });
});

export {dogsRouter}