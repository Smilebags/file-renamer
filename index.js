#!/usr/bin/env node
const fs = require("fs");
const process = require("process");
const path = require("path");

let targetFolder = process.argv[2] || "./";
let fileMatchPattern = process.argv[3] || "^([^.]*)$";
let fileNameTemplate = process.argv[4] || "{1}.jpg";

main();

async function main() {
    if (process.argv.length < 5) {
        console.log(`This program will default to adding '.jpg' to all files
in the current folder without an extension.
Is this what you want to do? (Y/n)`);
        let response = await getYesOrNo();
        if(response) {
            exec();
        } else {
            console.log(`Would you like to set the arguments now? No for exit (Y/n)`);
            let response = await getYesOrNo();
            if(response) {
                console.log(`Please enter the path to the folder you would like to operate in.
Blank for current folder`);
                let pathRes = await getUserInput();
                if(pathRes !== "") {
                    targetFolder = pathRes;
                }
                console.log(`Please enter the regex you would like to match files for.
Blank to match files with no extension`);
                let matchRes = await getUserInput();
                if(matchRes !== "") {
                    fileMatchPattern = matchRes;
                }
                console.log(`Please enter the pattern for the output files.
{1} will be replaced with the first capture group in the regex.
Blank to add '.jpg' to each file name`);
                let templateRes = await getUserInput();
                if(templateRes !== "") {
                    fileNameTemplate = templateRes;
                }
                console.log(`Will run with the following arguments:
Target Folder:         ${targetFolder}
File Matching Pattern: ${fileMatchPattern}
File Name Template:    ${fileNameTemplate}
Continue? (Y/n)`);
                let ready = await getYesOrNo();
                if(ready) {
                    exec();
                } else {
                    process.exit();
                }
            } else {
                process.exit();
            }
        }
    }
}

function isYes(response) {
    return /[Yy](es)?/.test(response);
}

function isNo(response) {
    return /[Nn](o)?/.test(response);
}

async function getUserInput() {
    return new Promise((resolve, reject) => {
        // readline.once('line', (input) => {
        //     console.log(`Received: ${input}`);
        //     resolve(input);
        //   });
        process.stdin.once("data", function (data) {
            let res = data.toString().replace(/[\n\r]+/,"");
            // console.log(data);
            // console.log(res);
            resolve(res);
        });
    });
}

async function getYesOrNo(defaultChoice = true) {
    // console.log(`getYesOrNo: ${defaultChoice}`);
    let response = await getUserInput();
    if(isYes(response)) {
        return true;
    } else if(isNo(response)) {
        return false;
    } else if (response === "") {
        return defaultChoice;
    } else {
        console.log(`(${defaultChoice ? "Y" : "y"}/${defaultChoice ? "n" : "N"})?`);
        return await getYesOrNo();
    }
}

function isFile(filePath) {
    return fs.lstatSync(filePath).isFile();
}

function exec() {
    let fileMatchRegex = new RegExp(fileMatchPattern);
    fs.readdir(targetFolder, (err, files) => {
        let totalChangedFiles = 0;
        let totalErrors = 0;
        // filter out folders
        files = files.filter((fileName) => {
            return isFile(path.join(targetFolder, fileName));
        });
        files.forEach(file => {
            let match = fileMatchRegex.exec(file);
            // check if we need to operate on this file
            if (match) {
                console.log(`Updating ${file}`);
                totalChangedFiles++;
                let [matchString, ...captureGroups] = match;
                let resultingFileName = fileNameTemplate;
                for (let i = 0; i < captureGroups.length; i++) {
                    const captureGroup = captureGroups[i];
                    resultingFileName = resultingFileName.replace(`{${i + 1}}`,captureGroup);
                }
                try {
                    fs.renameSync(
                        path.join(targetFolder, file),
                        path.join(targetFolder, resultingFileName)
                    );
                } catch (err) {
                        if (err) {
                            console.log("ERROR: " + err);
                            totalErrors++;
                        }
                    
                }
            }
        });
        console.log(`Updated ${totalChangedFiles} with ${totalErrors} errors.`);
        process.exit();
    });
}
