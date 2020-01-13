const { version } = require('./package.json');

module.exports = {
    VERSION: version,
    SUPPORTED_PLATFORMS: {
        "win32": true,
        "darwin": true,
        "linux": true,
        WINDOWS: "win32",
        MAC: "darwin",
        LINUX: "linux"
    },
    ERROR_TYPES: {
        NO_PERM: "NO_PERM",
        UNCONFIGURED: "UNCONFIGURED",
        INVALID_VALUES: "INVALID_VALUES"
    }
}