# csv_detective revisited

## Motivation

Discovering the types of columns of a dataset (stocked as a csv file) is an important step towards better understanding the contents of a data repository (such as DGF). For example, if we want to search the database for a specific value (a code SIREN, a departement code, a code INSEE, ...) we would have to search over each line of each csv to find the desired value. This operation could be facilitated by only looking into the csvs that contain codes SIREN, department codes or codes INSEE.

Another use case would be that of finding datasets that have values and columns in common. Although datasets have a context (a specific year, a specific location), finding the csv files that share information could lead to the discovery of correlations or to even improve the performance of predictive models by adding more information about certain instances.

## csv_detective
Four years ago, Leo Bouloc developed a tool named [csv_detective](https://github.com/etalab/csv_detective) in order to do just this:
>Organisations such as data.gouv aggregate huge amounts of un-normalised data. Performing cross-examination across datasets can be difficult. This tool [csv_detective] could help enrich the datasets metadata and facilitate linking them together.

The system works with regular expressions, heuristics, and by comparing strings with reference tables (for example, check if a postal code is a postal code because it appears in a official list of postal codes). The detected types range from addresses, booleans, commune names, geoJSONs, etc. 

While hand-crafted rules, such as those used by csv_detective, are useful to determine the decisions taken to select an specific type, it has some disadvantages. Firstly, maintaining and updating multiple rules usually becomes burdersome, and secondly, fixed rules and heuristics do not evolve with new types specifications.

Unfortunately, there is no reported accuracy of this tool. We do not know how trustable is the detection of column types.

Furthermore, the annotated dataset will allow us to measure the performance of csv_detective. In order to determine the quality of the results offered by the tool, we need to manually annotate several columns with their corresponding type. Below we detail our annotation.

### Annotating the top150 data.gouv.fr
Being part of ETALAB, it is only natural to base our experimentations on the data found in data.gouv.fr (DGF). Within this platform, there are around 27k files, linked or stored, which are identified as having a csv format (in DGF lingo, a csv file is called a resource). While the number of files is very large, there is a creme-de-la-creme of resources that are used more than the rest. These datasets amount to around 150 csv files  that are highly frequented by DGF users. 

As we wanted to do an annotation process as fast as possible and which in theory covered the largest number of most-frequent and most-interesting types, we based the annotation on these 146 files. 

The annotation involved first producing an annotation file that contained the following information: 
* each column name from each of the 146 files,
* a sample of 10 random values for each of the previous columns,
* the DGF internal id of the dataset,
* a column with the value found by csv_detective,
* a column to manually annotate the data.


The annotator then had to select from a drop-down list a type for each column.  The types (or classes) to determine are those found by csv_detective, which certainly limits the reach of the annotation but still serves as a good starting point.

An extract of the annotation file is shown below. The complete file contains around 4,700 lines (each line is the name of each column in the 146 csv files).

[IMG annotation file]

Once this file was created, the annotation consisted in merely looking at the sample values and choosing the appropriate type. 

### Evaluation
As said before, the annotated evaluation file allows us now to determine the quality of csv_detectiveh

## csv_detective_ml

As an alternative, and in order to significantly reduce the number of human-made heuristics and regexes, a supervised machine learning model could be used to automatically predict the type of a given value. Nonetheless, as with any supervised model, we first need training data generated by a human annotator to fit the model. 