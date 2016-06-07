var AWS = require('aws-sdk'),
    awsCredentialsPath = 'x.json',
    ProducerSqsQueueUrl = '',
    ConsumerSqsQueueUrl = ''
    
// Load credentials from local json file
AWS.config.loadFromPath(awsCredentialsPath);
// Instantiate SQS client

var sqs = new AWS.SQS();

var readMessages = function () {
	sqs.receiveMessage({
		   QueueUrl: ProducerSqsQueueUrl,
		   MaxNumberOfMessages: 10, // how many messages do we wanna retrieve?
		   VisibilityTimeout: 60, // seconds - how long we want a lock on this job
		   WaitTimeSeconds: 9 // seconds - how long should we wait for a message?
		 }, function (err, data) {
		 	if(err) console.log(err);
	 	if (data.Messages) {
	   	console.log(data.Messages.length);
	      // Handle each message one by one
	      for (var i = data.Messages.length - 1; i >= 0; i--) {
				var message = data.Messages[i],
				body = JSON.parse(message.Body);
				postToQueue(body, receiptHandle);
	      	}
		}
	})
}; 

var removeFromQueue = function(receiptHandle) {
   sqs.deleteMessage({
      QueueUrl: ProducerSqsQueueUrl,
      ReceiptHandle: receiptHandle
   }, function(err, data) {
      // If we errored, tell us that we did
      err && console.log("remove q error" + err);
   });
};

function postToQueue(messageBody, receiptHandle) {
	sqs.sendMessage({
		QueueUrl: ConsumerSqsQueueUrl,
		MessageBody: JSON.stringify(messageBody),
		DelaySeconds: 0,
	}, function (err, data) {
		if (err) console.log("Error -----" + err, err.stack); // an error occurred
	  	else {
	  		// console.log("success response" + JSON.stringify(data) +"\n receipt handle"+receiptHandle);           // successful response
	  		removeFromQueue(receiptHandle);  // We'll do this in a second
	  	}
	});
}

//Call read messages in a loop if there are more than 10 messages
readMessages();