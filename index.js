const mongoose = require('mongoose')
const Document = require('./models/Document')


MONGO_URI = 'mongodb+srv://dbUser:dbUserPassword@cluster0.a6ybs.mongodb.net/Cluster0?retryWrites=true&w=majority'

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`Mongoose connected to ${conn.connection.host} `);
        
    } catch (err) {
        console.log(`Error : ${err.message}`);
        process.exit(1)
    }
}

connectDB()

const io = require('socket.io')(4000, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

const defaultValue = ''

io.on("connection", socket => {
    socket.on('get-document', async documentId => {
        const document = await findOrcreateDocument(documentId)
        socket.join(documentId)
        socket.emit('load-document', document.data)

        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    })
})

async function findOrcreateDocument(id) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
}
