const Ganache = require("ganache-core");
const { exec } = require('child_process');

const isPortTaken = function(port, fn) {
    const net = require('net');
    const tester = net.createServer()
        .once('error', function (err) {
            if (err.code !== 'EADDRINUSE') return fn(err);
            fn(null, true)
        })
        .once('listening', function() {
            tester.once('close', function() { fn(null, false) })
                .close()
        })
        .listen(port)
};


const setup = async () => new Promise((ok, ko) => {
    console.log("\n+--------------------------------------+");
    console.log("| Starting Test Setup                  |");
    console.log("+--------------------------------------+\n");
    global.Server = Ganache.server({vmErrorsOnRPCResponse: true});
    let intervalId = setInterval(() => {
        isPortTaken(8546, (err, status) => {
            if (status === false) {
                Server.listen(8546, (err) => {
                    if (err)
                        ko(err);
                    console.log("# Started Ganache server on port 8546");
                    exec("cd setup/truffle && ../../node_modules/.bin/truffle migrate --reset && cd ../..", (err, stdout, stderr) => {
                        if (err)
                            ko(err);
                        console.log("# Deployed Smart Contracts with Truffle");
                        if (stdout)
                            console.error(stdout);
                        if (stderr)
                            console.error(stderr);
                        exec("cd setup/embark && npm install && ../../node_modules/.bin/embark build && cd ../..", (err, stdout, stderr) => {
                            if (err)
                                ko(err);
                            console.log("# Deployed Smart Contracts with Embark");
                            if (stdout)
                                console.error(stdout);
                            if (stderr)
                                console.error(stderr);
                            console.log("\n+--------------------------------------+");
                            console.log("| Test Setup Successful                |");
                            console.log("+--------------------------------------+\n");
                            ok();
                        });
                    });
                });
                clearInterval(intervalId);
            } else {
                console.warn("Port 8546 is taken, waiting ...");
            }
        })
    }, 5000);

});

module.exports = setup;
