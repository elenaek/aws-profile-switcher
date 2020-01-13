#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const cli = require('commander');
const { prompt } = require('inquirer');


const { SUPPORTED_PLATFORMS, ERROR_TYPES } = require('./constants');
const { handleErrors } = require('./errors');
const awsDefaultDirectory = `${os.homedir()}\\.aws`;
const awsDefaultCredentialsPath = `${os.homedir()}\\.aws\\credentials`;
const awsProfileLinkFilesDir = `${awsDefaultDirectory}\\profiles`;
const awsChosenProfileSymlink = `${awsDefaultDirectory}\\chosenProfile`;

const initialize = () => {
    initializeProfiles(awsDefaultCredentialsPath);
    initializeLink();
}

const initializeLink = () => {
    if(!fs.existsSync(awsChosenProfileSymlink)){
        let { WINDOWS, MAC, LINUX } = SUPPORTED_PLATFORMS;
        let currentPlatform = os.platform();
        
        try{
            fs.symlinkSync(`${awsProfileLinkFilesDir}\\default`, awsChosenProfileSymlink, "file")
        } catch(err) {
            handleErrors(ERROR_TYPES.NO_PERM);
            return
        }

        if(SUPPORTED_PLATFORMS[`${currentPlatform}`]){
            switch(currentPlatform){
                case WINDOWS:
                    exec(`setx AWS_SHARED_CREDENTIALS_FILE ${awsChosenProfileSymlink} & setx AWS_PROFILE default`, (err, stdOut, stdErr) => {
                        if(err){
                            console.log(`ERROR: ${err}`)
                            return;
                        }
                        if(stdErr){
                            console.log(`STDERR: ${stdErr}`)
                            return;
                        }
                        console.log(`Your AWS profile switcher environment has been configured. Please restart your shell to begin using it!`)
                    });
                    break;
            }
        }
    }
}

const initializeProfiles = (credentialsPath) => {
    createProfileFiles(parseProfiles(credentialsPath));
}

const addAWSProfile = (profileName, accessKey, secretKey) => {
    if(profileName && accessKey && secretKey){
        let profileTemplate = `\n[${profileName}]\naws_access_key_id = ${accessKey}\naws_secret_access_key = ${secretKey}\n`;
        try{
            fs.appendFileSync(awsDefaultCredentialsPath, profileTemplate);
            console.log(`${profileName} has been added as an available profile for use. `)
        } catch(err) {
            handleErrors(ERROR_TYPES.NO_PERM);
        }
    }

    else { handleErrors(ERROR_TYPES.INVALID_VALUES) }
}

const parseProfiles = (credentialsPath) => {
    let credentialPattern = /\[.+\]$\s{1,2}^.+$\s{1,2}^.+$/igm;
    let data;
    try{
        data = fs.readFileSync(credentialsPath, "utf8");
    } catch(err) {
        handleErrors(ERROR_TYPES.NO_PERM);
        return
    }

    let parsedProfilesObj = {};
    let profilesArr = data.match(credentialPattern);

    profilesArr.forEach((profile) => {
        let profileNamePattern = /^\[(.+)\]$/igm;
        let profileName = profileNamePattern.exec(profile)[1];
        parsedProfilesObj[`${profileName}`] = profile.replace(profileNamePattern, "[default]\n");
    });

    return parsedProfilesObj;
}

const checkConfiguration = () => {
    if(!fs.existsSync(awsDefaultDirectory)){
        return handleErrors(ERROR_TYPES.UNCONFIGURED, "You do not have a credentials file in the default directory!")
    }

    if(!fs.existsSync(awsChosenProfileSymlink)){
        return handleErrors(ERROR_TYPES.UNCONFIGURED)
    }
}

const createProfileFiles = (parsedProfileObj) => {
    if(!fs.existsSync(awsProfileLinkFilesDir)){
        try{
            fs.mkdirSync(awsProfileLinkFilesDir);
        }
        catch(err){
            handleErrors(ERROR_TYPES.NO_PERM);
            return;
        }
    }

    let profilesArr = Object.keys(parsedProfileObj);

    profilesArr.forEach((profileName) => {
        let profileFilePath = `${awsProfileLinkFilesDir}\\${profileName}`;
        if(!fs.existsSync(profileFilePath)){
            fs.writeFileSync(profileFilePath, parsedProfileObj[`${profileName}`]);
        }
    });
}

const getCurrentProfile = () => {
    if(fs.existsSync(awsChosenProfileSymlink)){
        let chosenProfile = path.basename(fs.readlinkSync(awsChosenProfileSymlink));
        return chosenProfile;
    }
    else {
        handleErrors(ERROR_TYPES.UNCONFIGURED);
    }
}

const listAvailableProfiles = () => {
    initializeProfiles(awsDefaultCredentialsPath);
    return fs.readdirSync(awsProfileLinkFilesDir);
}

const checkPermissions = () => {
    let testSymlinkPath = `${awsDefaultDirectory}\\test.tmp`;
    try{
        fs.accessSync(awsDefaultCredentialsPath, fs.constants.W_OK);
        fs.symlinkSync(awsDefaultCredentialsPath, testSymlinkPath);
    } catch(err) {
        handleErrors(ERROR_TYPES.NO_PERM);
    } finally {
        if(fs.existsSync(testSymlinkPath)){
            fs.unlinkSync(testSymlinkPath);
        }
    }
}

const setAwsProfile = (awsProfileName) => {
    let targetProfilePath = `${awsProfileLinkFilesDir}\\${awsProfileName}`;

    if(fs.existsSync(targetProfilePath)){
        try{
            fs.unlinkSync(awsChosenProfileSymlink);
            fs.symlinkSync(targetProfilePath, awsChosenProfileSymlink, "file");
        } catch(err) {
            console.log(err);
            handleErrors(ERROR_TYPES.NO_PERM);
            return
        }
        console.log(`Your AWS cli has been set to use the profile: ${awsProfileName}.`);
    }
}

const removeConfiguration = () => {
    try{
        if(fs.existsSync(awsChosenProfileSymlink)){
            fs.unlinkSync(awsChosenProfileSymlink);
        }
    
        if(fs.existsSync(awsProfileLinkFilesDir)){
            fs.rmdirSync(awsProfileLinkFilesDir);
        }
    } catch(err) {
        handleErrors(ERROR_TYPES.NO_PERM);
        return
    }

    if(SUPPORTED_PLATFORMS[`${currentPlatform}`]){
        switch(currentPlatform){
            case WINDOWS:
                exec(`setx AWS_SHARED_CREDENTIALS_FILE ${awsDefaultCredentialsPath}`, (err, stdOut, stdErr) => {
                    if(err){
                        console.log(`ERROR: ${err}`)
                        return;
                    }
                    if(stdErr){
                        console.log(`STDERR: ${stdErr}`)
                        return;
                    }
                });
                break;
        }
    }
}


/** SHELL COMPONENTS BEGIN HERE */


cli
    .name("awsps")
    .version("0.5.0")
    .description("Tool used for easily switching between AWS profiles declared in your credentials file for AWS cli.");

cli
    .command('configure')
    .description(`Configure your system to use AWSPS.`)
    .action(() => {
        initialize();
    });

cli
    .command('current')
    .description(`Shows your current AWS profile.`)
    .action(() => {
        let currentProfile = getCurrentProfile();
        console.log(`You are currently using the profile: ${currentProfile}`);
    });

cli
    .command('list')
    .description(`Lists your existing AWS profiles. Your current profile is marked with an arrow.`)
    .action(() => {
        let availableProfilesArr = listAvailableProfiles();
        let currentProfile = getCurrentProfile();
        let outputStr = "";
        console.log("\n<===Available Profiles===>")
        availableProfilesArr.forEach(profile => {
            if(profile === currentProfile){
                outputStr += `${profile} <-- \n`;
            }
            else {
                outputStr += `${profile}\n`;
            }
        });
        console.log(outputStr);
    });

cli
    .command('use [profileName]')
    .description(`Sets an AWS profile to use for AWS cli. If no profile is specified you will get a selection prompt.`)
    .action((profileName) => {
        checkPermissions();
        let availableProfilesArr = listAvailableProfiles();
        let currentProfile = getCurrentProfile();
        if(profileName){
            setAwsProfile(profileName);
        }
        else{
            const profileSelectionPrompt = [
                {
                    name: "selectedProfile",
                    message: "<----AWS Profile Selection---->",
                    default: currentProfile,
                    choices: availableProfilesArr,
                    type: "list"
                }
            ]
            prompt(profileSelectionPrompt)
            .then((input) => {
                let { selectedProfile } = input;
                setAwsProfile(selectedProfile);
            });
        }
    });

cli
    .command('add')
    .description(`Add an AWS profile and make available for use with "awsps use".`)
    .action(() => {
        const profileAddPrompt = [
            {
                name: "profileNameToAdd",
                message: "Enter a name for this profile:",
                type: "input"
            },
            {
                name: "accessKeyToAdd",
                message: "Enter the access key id:",
                type: "input"
            },
            {
                name: "secretKeyToAdd",
                message: "Enter the secret key:",
                type: "input"
            }
        ];

        prompt(profileAddPrompt)
        .then((input) => {
            let { profileNameToAdd, accessKeyToAdd, secretKeyToAdd } = input;
            addAWSProfile(profileNameToAdd, accessKeyToAdd, secretKeyToAdd);
        })
    });

cli
    .command('uninstall')
    .description(`Removes all AWSPS configuration and sets AWS_PROFILE to default.`)
    .action(() => {
        removeConfiguration();
    });

cli.parse(process.argv);

if(!process.argv.slice(2).length){
    cli.outputHelp();
    return
}


