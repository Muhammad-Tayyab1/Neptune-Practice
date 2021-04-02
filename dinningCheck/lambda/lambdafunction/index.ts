import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import {driver, process as gprocess, structure} from  'gremlin'
import * as async from 'async'

declare var process :{
    env :{
        NEPTUNE_ENDPOINT: string
    }
}

let conn: driver.DriverRemoteConnection;
let g: gprocess.GraphTraversalSource;

async function query() {
    return g.V().limit(1).count().next()
};

async function doQuery() {
    let result = await query();
    return {
        statusCode: 200,
        headers: { "Context-Type": "text/plain"},
        body: result["value"]
    };
}

export async function handler(event: APIGatewayProxyEvent, context: Context) {
    const getConnenctionDetails = ()=>{
        const database_url = 'wss://' + process.env.NEPTUNE_ENDPOINT + ':8182/gremlin';
        return {url: database_url, headers: {}};
    };
    const createRemoteConnection = () =>{
        const {url, headers} = getConnenctionDetails();
        return new driver.DriverRemoteConnection(
            url, {
                mimeType: 'application/vnd.gremlin-v2.0+json',
                pingEnable: false,
                headers: headers
            }
        )
    };
    const createGraphTraversalSource = (conn: driver.DriverRemoteConnection)=>{
        return gprocess.traversal().withRemote(conn);
    };
    if (conn==null) {
        conn = createRemoteConnection();
        g = createGraphTraversalSource(conn)
    };
    return async.retry(
        {
            times: 5,
            interval: 1000,
            errorFilter: function (err){
                console.warn('Determining weather retriable error: ' + err.message);
                
                if (err.message.startsWith('WebSocket is not open')) {
                    console.warn('Reopening connection');
                    conn.close();
                    conn = createRemoteConnection();
                    g = createGraphTraversalSource(conn);
                    return true;
                }

                if (err.message.includes('ConcurrentModificationException')) {
                    console.warn('Retrying query because of ConcurrentModificationException')
                    return true;
                };

                if (err.message.includes('ReadOnlyViolationException')) {
                    console.warn('Retrying query because of ReadOnlyViolationException');
                    return true
                };
                return true;
            }

        },
        doQuery)
}