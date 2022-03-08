var amqp = require('amqplib/callback_api');

function geraVetor(vetor, tamanho) {
    for (i = 0; i < tamanho; i++) {
        vetor[i] = ((i - tamanho / 2) ** 2);
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
        var tamanho = parseInt(process.argv.slice(2)[0]) || 100;
        var div = parseInt(process.argv.slice(2)[1]) || 1;

        var vetor = [];
        geraVetor(vetor, tamanho);

        channel.assertExchange(exchange, 'fanout', {
            durable: false
        });

        var inicio = 0;
        var final = 0;
        var tam_por_div = tamanho / div;
        for (i = 0; i < div; i++) {
            inicio = i * tam_por_div;
            final = inicio + tam_por_div;
            var stringArray = vetor.slice(inicio, final).join(" ")
            channel.publish(exchange, '', Buffer.from(stringArray));
            console.log(`[x] Sent ${i} ${stringArray}`);
        }

        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = 'response';

            channel.assertQueue(queue, {
                durable: false
            });

            channel.consume(queue, function (msg) {
                console.log(" [*] Received %s", msg.content.toString());
            }, {
                noAck: true
            });
        });
    });
});
