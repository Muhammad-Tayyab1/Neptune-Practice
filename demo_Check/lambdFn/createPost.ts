const gremlin = require('gremlin')
import Post from './Post'

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection
const Graph = gremlin.structure.Graph
const uri = process.env.WRITER

async function createPost(post: Post) {
    let dc = new DriverRemoteConnection(`wss://${uri}/gremlin`, {})
    const graph = new Graph()
    const g = graph.traversal().withRemote(dc)

    const data = await g.addV('posts').property('title',post.title).property('content', post.content).next()
    post.id = data.value.id
    dc.close()
    return post
}
export default createPost