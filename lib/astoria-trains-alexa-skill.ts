import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import lambda = require('@aws-cdk/aws-lambda');
import secretsmanager = require('@aws-cdk/aws-secretsmanager');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import cdk = require('@aws-cdk/core');


export class AstoriaTrainsStack extends cdk.Stack {
  constructor(app: cdk.App, id: string) {
    super(app, id);

    const table = new dynamodb.Table(this, 'TrainsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const cronFn = new lambda.Function(this, 'TrainScheduleCron', {
      code: lambda.Code.asset('resources'),
      handler: 'trains.main',
      timeout: cdk.Duration.seconds(10),
      runtime: lambda.Runtime.NODEJS_8_10,
      environment: {
        DYNAMO_TABLE_NAME: table.tableName
      }
    });

    const alexaFn = new lambda.Function(this, 'MTAAlexaSkill', {
      code: lambda.Code.asset('resources'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      runtime: lambda.Runtime.NODEJS_8_10,
      environment: {
        DYNAMO_TABLE_NAME: table.tableName
      }
    });

    const newAlexaFn = new lambda.Function(this, 'NewMTAAlexaSkill', {
      code: lambda.Code.asset('resources'),
      handler: 'new.handler',
      timeout: cdk.Duration.seconds(10),
      runtime: lambda.Runtime.NODEJS_8_10,
      environment: {
        DYNAMO_TABLE_NAME: table.tableName
      }
    });

    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.expression('rate(1 minute)')
    });

    rule.addTarget(new targets.LambdaFunction(cronFn));

    const secret = secretsmanager.Secret.fromSecretAttributes(this, 'ImportedSecret', {
      secretArn: 'arn:aws:secretsmanager:us-east-1:579709515411:secret:MTA_API_KEY-ReKZgL',
    });

    secret.grantRead(cronFn);
    table.grantWriteData(cronFn);
    table.grantReadData(alexaFn);
    table.grantReadData(newAlexaFn);

  }
}

const app = new cdk.App();
new AstoriaTrainsStack(app, 'AstoriaTrainsAlexaSkill');
app.synth();