import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as neptune from '@aws-cdk/aws-neptune';
export class DemoCheckStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const api= new appsync.GraphqlApi(this, 'Api',{
      name: 'NeptuneApi',
      schema: appsync.Schema.fromAsset('graphql/schema.gql'),
      authorizationConfig: {
        defaultAuthorization:{
          authorizationType: appsync.AuthorizationType.API_KEY
        }
      }
    });
    const vpc = new ec2.Vpc(this, 'NeptuneVpc');

    const lambdaFn= new lambda.Function(this, 'Lambda',{
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('lambdFn'),
      memorySize: 1024,
      vpc
    })

    const lambdads = api.addLambdaDataSource('lambdDataSource', lambdaFn);
    lambdads.createResolver({
      typeName: 'Query',
      fieldName: 'listPost'
    }) 
  lambdads.createResolver({
    typeName: 'Mutation',
    fieldName: 'createPost'
  });

  const cluster= new neptune.DatabaseCluster(this,'NeptuneCluster',{
    vpc,
    instanceType: neptune.InstanceType.T3_MEDIUM
  });
  cluster.connections.allowDefaultPortFromAnyIpv4('Open to World');
  const writeAddress = cluster.clusterEndpoint.socketAddress;
  const readAddress = cluster.clusterReadEndpoint.socketAddress;

  new cdk.CfnOutput(this, 'writeAddress',{
    value: writeAddress
  });
  new cdk.CfnOutput(this, 'readAddress',{
    value: readAddress
  });
  lambdaFn.addEnvironment('WRITER', writeAddress);
  lambdaFn.addEnvironment('READER', readAddress)
  
}

}
