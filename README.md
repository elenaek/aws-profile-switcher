# Overview
awsps is a shell tool for easily switching and mangaing AWS profiles for AWS CLI. 

# Prerequisites
- Node.js installed
- AWS Credentials file in your home directory (run `aws configure` using AWS CLI)

# Supported Platforms (Tested)
- Windows 10

# Getting started
1. `npm install -g awsps` : Installs awsps
2. `awsps configure` : Configures the necessary settings to use awsps
3. Restart your shell (first time setup only)
4. You are now set up to use awsps!


# Commands

**Setting up awsps for use**

```awsps configure```

The `configure` command will configure your system to use awsps. You will be required to restart your shell after the configuration is complete.

**Adding an AWS Profile**

```awsps add```

The `add` command will take you through an input prompt to create a new profile. You will need your accessKeyId and secretKey for this.

**Selecting an AWS Profile for Usage**

```awsps use [profileName]```

The `use` command will allow you to select an available AWS Profile to use. You can also skip the prompt by inputting a profile name that you know exists.

**Listing available AWS Profiles**

```awsps list```

The `list` command shows you the AWS profiles you have available to you. It'll mark the profile you are currently using with "<--".

**Show Current Profile**

```awsps current```

The `current` command will show you the AWS profile you're currently using for AWS CLI.

**Uninstalling**

```awsps uninstall```

The `uninstall` command will remove any configuration from awsps.



