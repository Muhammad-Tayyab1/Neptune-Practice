import * as cdk from '@aws-cdk/core';
import * as appsync  from '@aws-cdk/aws-appsync';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as neptune from "@aws-cdk/aws-neptune";
export class DinningCheckStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const Api= new appsync.GraphqlApi(this, 'DinningApi',{
      name: 'DinningByFrientApi',
      schema: appsync.Schema.fromAsset('graphql/schema.gql'),
      authorizationConfig: {
        defaultAuthorization:{
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.hours(365))
          }
        }
      }
    })
const vpc= new ec2.Vpc(this, 'Vpc',{
  subnetConfiguration:[
    {
      cidrMask: 24,
      name: 'Ingress',
      subnetType: ec2.SubnetType.ISOLATED
    }
  ]
})
const securityGroup=new ec2.SecurityGroup(this, 'mySecurtiyGroup',{
  vpc,
  allowAllOutbound: true,
  description: 'Security Group',
  securityGroupName: 'mySecurityGroup',

});
cdk.Tags.of(securityGroup).add('Name', 'mySecurityGroup');
securityGroup.addIngressRule(securityGroup, ec2.Port.tcp(8182), 'MyRule');

const neptuneSubnet =  new neptune.CfnDBSubnetGroup(this, 'NeptuneSubnet',{
  dbSubnetGroupDescription: 'My Subnet',
  subnetIds: vpc.selectSubnets({subnetType:ec2.SubnetType.ISOLATED}).subnetIds,
  dbSubnetGroupName: 'mysubnetgroup'
});

const neptuneCluster = new neptune.CfnDBCluster(this, 'MyCluster',{
dbSubnetGroupName: neptuneSubnet.dbSubnetGroupName,
dbClusterIdentifier: 'myDbCluster',
vpcSecurityGroupIds: [securityGroup.securityGroupId]
})
neptuneCluster.addDependsOn(neptuneSubnet);

const neptuneInstance =  new neptune.CfnDBInstance(this, 'myinstance',{
  dbInstanceClass: 'db.t3.medium',
  dbClusterIdentifier: neptuneCluster.dbClusterIdentifier,
  availabilityZone: vpc.availabilityZones[0],
});
neptuneInstance.addDependsOn(neptuneCluster);

const lambdaHandler= new lambda.Function(this, 'Lambda',{
  runtime: lambda.Runtime.NODEJS_14_X,
  code: new lambda.AssetCode('lambda/lambdafunction'),
  handler: 'index.handler',
  vpc: vpc,
  securityGroups: [securityGroup],
  environment: {
    NEPTUNE_ENDPOINT: neptuneCluster.attrEndpoint
  },
  vpcSubnets: {
    subnetType: ec2.SubnetType.ISOLATED
  }
});
const lambdaDs = Api.addLambdaDataSource('LambdaDataSource', lambdaHandler)
const apigateway = new apigw.LambdaRestApi(this, 'api',{
  handler: lambdaHandler
})

  }
}
