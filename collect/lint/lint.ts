/* eslint-disable no-console */

import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import dataSchema from './dataSchema';

import data from '../../data/compare.json';
import tags from '../../data/tags.json';
import { Comparison } from '../types';

let unhappy = false;

// --------------------------------------------
// validate data.json
// see if it matches the schema

const ajv = new Ajv();

const validateData = ajv.compile(dataSchema);

console.log('Linting data.json...');
const isDataValid = validateData(data);
if (isDataValid) {
    console.log('data.json is valid');
} else {
    console.log(validateData.errors);
    unhappy = true;
}

// --------------------------------------------
// validate tags.json
// see if all the tags in data.json are are in tags.json
console.log('Linting tags.json...');

const dataTags = data.reduce<Set<string>>((accumulator, current) => {
    for (const tag of current.tags) {
        accumulator.add(tag);
    }
    return accumulator;
}, new Set<string>());

const tagsTags = Object.keys(tags);

// eslint-disable-next-line unicorn/prefer-spread
const missingTags = Array.from(dataTags).filter((tag) => !tagsTags.includes(tag));

if (missingTags.length > 0) {
    console.log('The following tags are in data.json but not in tags.json');
    console.log(missingTags);
    unhappy = true;
} else {
    console.log('All tags in data.json are in tags.json');
}

// --------------------------------------------
// validate graph data
// see if all the csv files are valid csv files
console.log('Linting graph data...');

const graphDataPath = path.join(__dirname, '../../data/graphs');

const graphDataFiles = fs.readdirSync(graphDataPath);
const graphDataFilesWithExtension = graphDataFiles.filter((file) => file.endsWith('.csv'));

for (const file of graphDataFilesWithExtension) {
    const filePath = path.join(graphDataPath, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');

    const lines = fileContents.split('\n');

    // the first line should not be empty
    if (lines[0].trim() === '') {
        console.log(`The first line of ${file} is empty`);
        unhappy = true;
    }

    // the last line should not be empty
    if ((lines.at(-1)?.trim() ?? '') === '') {
        console.log(`The last line of ${file} is empty`);
        unhappy = true;
    }

    // all lines should have 2 parts (date and number)
    for (const line of lines) {
        const lineNumber = lines.indexOf(line) + 1;

        const parts = line.split(',');

        if (parts.length !== 2) {
            console.log(`Line ${lineNumber} in ${file}:${lineNumber} does not have 2 parts`);
            unhappy = true;
        }

        // the first part should be a date
        const date = new Date(parts[0]);
        if (Number.isNaN(date.getTime())) {
            console.log(`Line ${lineNumber} in ${file}:${lineNumber} does not have a valid date`);
            unhappy = true;
        }

        // the second part should be a number
        const number = Number.parseInt(parts[1], 10);
        if (Number.isNaN(number)) {
            console.log(`Line ${lineNumber} in ${file}:${lineNumber} does not have a valid number`);
            unhappy = true;
        }
    }
}

// --------------------------------------------
// see if all the csv files are in data.json
console.log('Are all the csv files in data.json?...');

const graphDataFilesTwo = fs.readdirSync(graphDataPath);
const graphDataFilesWithExtensionTwo = graphDataFilesTwo.filter((file) => file.endsWith('.csv'));
const graphDataFilesWithoutExtensionTwo = graphDataFilesWithExtensionTwo.map((file) => file.replace('.csv', ''));

const dataIDS = new Set(data.map((item) => item.id));

// eslint-disable-next-line unicorn/prefer-spread
const missingIDs = graphDataFilesWithoutExtensionTwo.filter((id) => !dataIDS.has(id));

if (missingIDs.length > 0) {
    console.log('The following ids are in graph data but not in data.json');
    console.log(missingIDs);
    unhappy = true;
}

// --------------------------------------------
// checking for duplicate ids in data.json
console.log('Checking for duplicate ids in data.json...');

const ids = new Set<string>();
const duplicateIds = new Set<string>();

for (const item of data) {
    if (ids.has(item.id)) {
        duplicateIds.add(item.id);
    } else {
        ids.add(item.id);
    }
}

if (duplicateIds.size > 0) {
    console.log('The following ids are duplicated in data.json');
    console.log(duplicateIds);
    unhappy = true;
}

// --------------------------------------------
// find the oldest date in the data

console.log('Finding the oldest date in the data...');

const oldestDate = data.reduce<[Date, Comparison]>((accumulator, current) => {
    const date = new Date(current.lastUpdated);
    if (Number.isNaN(date.getTime())) {
        return accumulator;
    }

    if (date < accumulator[0]) {
        return [date, current];
    }

    return accumulator;
}, [new Date(), data[0]]);

console.log(`The oldest date in the data is ${oldestDate[0].toISOString()} in ${oldestDate[1].name}`);

// --------------------------------------------
// exit with the correct exit code
// 0 if happy, 1 if unhappy
if (unhappy) {
    process.exitCode = 1;
}
