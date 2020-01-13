const { ERROR_TYPES } = require('./constants');

module.exports = {
    handleErrors: (errorType, msg) => {
        switch(errorType){
            case ERROR_TYPES.NO_PERM:
                console.log("You are not permitted to run this. Please elevate privleges and try again.");
                process.exit();
                break;
            case ERROR_TYPES.UNCONFIGURED:
                if(!msg){ console.log(`Your system hasn't been configured to use AWSPS yet. Please run "awsps configure"`); }
                else { console.log(msg) }
                process.exit();
                break;
            case ERROR_TYPES.INVALID_VALUES:
                console.log(`There are invalid values.`)
                process.exit();
                break;
        }
    }
}