// logger.js
const winston = require("winston");

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: "app.log" })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

function logMiddleware(req, res, next) {
  const { method, url, body } = req;
  const logBody = { ...body };
  if (logBody.password) delete logBody.password;

  const oldSend = res.send;
  res.send = function (data) {
    logger.info({
      timestamp: new Date().toISOString(),
      method,
      endpoint: url,
      request: logBody,
      statusCode: res.statusCode
    });
    oldSend.apply(res, arguments);
  };

  next();
}

module.exports = { logger, logMiddleware };
