const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

const getSchedule = async (id) => {
    const params = {
        Key: {
            id
        },
        TableName: process.env.DYNAMO_TABLE_NAME
    }
    const { Item } = await ddb.get(params).promise();
    console.log(Item.schedule);
    return Item.schedule;
}

const getResponseText = (trains, direction, station) => {
    let speechText;
    if (trains.length > 1) {
        speechText = `At ${station}, there is a ${direction} bound ${trains[0].routeId} train in ${Math.floor(((trains[0].arrivalTime * 1000) - Date.now()) / 1000 / 60)} minutes and a ${trains[1].routeId} train in ${Math.floor(((trains[1].arrivalTime * 1000) - Date.now()) / 1000 / 60)} minutes`;
    } else if (trains.length == 1) {
        speechText = `At ${station}, there is a ${direction} bound ${trains[0].routeId} train in ${Math.floor(((trains[0].arrivalTime * 1000) - Date.now()) / 1000 / 60)} minutes`;
    } else {
        speechText = `There are no upcoming ${direction} bound trains`;
    }
    return speechText;
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'You can ask about Manhattan or Queens bound trains';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Broadway N/W', speechText)
            .getResponse();
    },
};

const GetTrainScheduleHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetTrainScheduleIntent';
    },
    async handle(handlerInput) {
        console.log(JSON.stringify(handlerInput));
        const speechText = "Testing"
        if (handlerInput.requestEnvelope.request.intent.slots.station.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_MATCH"){
            // Failed to match station. Deal with it
            return handlerInput.responseBuilder
                .speak('I didn\'t understand the station. Please try again')
                .reprompt('I didn\'t understand the station. Please try again')
                .getResponse();
        } else if (handlerInput.requestEnvelope.request.intent.slots.direction.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_MATCH"){
            return handlerInput.responseBuilder
                .speak('I didn\'t understand the direction of train. Please try again')
                .reprompt('I didn\'t understand the direction of train. Please try again')
                .getResponse();
        } else {
            const station = handlerInput.requestEnvelope.request.intent.slots.station.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            const direction = handlerInput.requestEnvelope.request.intent.slots.direction.resolutions.resolutionsPerAuthority[0].values[0].value.name;

            console.log("Getting schedule for station", station);
            const schedule = await getSchedule(station);

            const trainsArr = direction === "North" ? schedule.N : schedule.S;
            const futureTrains = trainsArr.filter(train => train.arrivalTime * 1000 > Date.now());
            const speechText = getResponseText(futureTrains, direction === "North" ? "Queens" : "Manhattan", station);
            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard(`${station} ${direction === "North" ? "Queens" : "Manhattan"} Trains`, speechText)
                .getResponse();
        }
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can ask when the next Manhattan or Queens bound trains are!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('How to use', speechText)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Subway', speechText)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, I can\'t understand the command. Please say again.')
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        GetTrainScheduleHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
