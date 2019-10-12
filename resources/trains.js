const Mta = require('mta-gtfs');
const AWS = require('aws-sdk'),
    region = "us-east-1",
    secretName = "MTA_API_KEY";

const client = new AWS.SecretsManager({
    region: region
});

const docClient = new AWS.DynamoDB.DocumentClient();


const stations = [
    {
        id: 'R01',
        name: 'Ditmars'
    },
    {
        id: 'R03',
        name: 'Astoria'
    },
    {
        id: 'R04',
        name: '30th'
    },
    {
        id: 'R05',
        name: 'Broadway'
    },
    {
        id: 'R06',
        name: '36th'
    },
    {
        id: 'R08',
        name: '39th'
    }
]

exports.main = async function (event, context) {
    let data = await (client.getSecretValue({ SecretId: secretName }).promise());
    let secret = data.SecretString;

    const mta = new Mta({
        key: JSON.parse(secret).API_KEY, // only needed for mta.schedule() method
        feed_id: 16                  // optional, default = 1
    });

    const p = [];
    for (const station of stations) {
        p.push(new Promise((resolve, reject) => {
            mta.schedule(station.id).then(schedule =>
                resolve({ schedule, id: station.id, name: station.name })
            ).catch(err => reject(err))
        }))
    }
    await Promise.all(p).then(schedules => {
        var params = {
            RequestItems: {
                [process.env.DYNAMO_TABLE_NAME]: schedules.map(({ schedule, id, name }) => ({
                    PutRequest: {
                        Item: {
                            id: name,
                            schedule: schedule.schedule[id]
                        }
                    }
                }))
            }
        };
        docClient.batchWrite(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
            }
        });
    })
}
