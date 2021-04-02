const gremlin = require('gremlin')

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
const uri = process.env.READER

async function listPost() {
    let dc = new DriverRemoteConnection(`wss://${uri}/gremlin`, {});
    const graph = new Graph();
    const g = graph.traversal().withRemote(dc);
    try {
        let data = await g.V().hasLabel('posts').toList()
        let posts = Array()
        
        for (const v of data) {
            const _properties = await g.V(v.id).properties.toList()
            let post = _properties.reduce((acc: any, next: any)=>{
                acc[next.label] = next.value
                return acc
            }, {})
            post.id =v.id
            posts.push(post)            
        }
        dc.close()
        return posts
    } catch (error) {
        console.log('Error', error)
        return null
    }
}
export default listPost