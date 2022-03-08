var amqp = require('amqplib/callback_api');

var maior = -99999;
var count = 0;

function verificaMaior(vetor) {
    for (i = 0; i < vetor.length; i++) {
        if (parseFloat(vetor[i]) > maior) maior = parseFloat(vetor[i]);
    }
}

amqp.connect('amqp://localhost', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        var exchange = 'vetor';
        var div = parseInt(process.argv.slice(2)[0]) || 1;

        channel.assertExchange(exchange, 'fanout', {
            durable: false
        });

        channel.assertQueue('', {
            exclusive: true
        }, function (error2, q) {
            if (error2) {
                throw error2;
            }
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
            channel.bindQueue(q.queue, exchange, '');

            channel.consume(q.queue, function (vetor) {
                var vetorString = vetor.content.toString()
                var objVetor = vetorString.split(" ")
                if (vetor.content) {
                    console.log(` [x] vetor recebido!`);
                    console.log(vetor.content.toString());
                    verificaMaior(objVetor);

                    console.log(` [*] O maior valor é:${maior}`);
                    count++;

                    if (count == div) {
                        connection.createChannel(function (error1, channel) {
                            if (error1) {
                                throw error1;
                            }

                            var queue = 'response';
                            var msg = maior;

                            channel.assertQueue(queue, {
                                durable: false
                            });
                            channel.sendToQueue(queue, Buffer.from(msg.toString()));

                            console.log(" [*] Sent %s", msg);
                        });
                    }
                }
            }, {
                noAck: false
            });
        });
    });
});
