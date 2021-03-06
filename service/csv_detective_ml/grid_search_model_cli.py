'''Loads an annotated file and extracts features and tagged types for each resource id

Usage:
    train_model.py <train> <test> <p> <m> [options]

Arguments:
    <train>                                Input train file
    <test>                                Input test file
    <p>                                Path where to find the resource's CSVs
    <m>                                Path where to save the trained pipeline [default: "models/"]
    --cores=<n> CORES                  Number of cores to use [default: 2:int]
'''
# import logging
from itertools import product

import joblib
from argopt import argopt
from sklearn import clone
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer, HashingVectorizer
from sklearn.metrics import f1_score
from sklearn.pipeline import Pipeline, FeatureUnion
from tqdm import tqdm
from xgboost import XGBClassifier
import json

# logger = logging.getLogger()
# logger.setLevel(logging.DEBUG)
# logger.addHandler(logging.StreamHandler())
from features import ItemSelector, CustomFeatures, ColumnInfoExtractor

if __name__ == '__main__':
    parser = argopt(__doc__).parse_args()
    train_file_path = parser.train
    test_file_path = parser.test
    csv_folder_path = parser.p
    output_model_path = parser.m
    n_cores = int(parser.cores)

    pipeline = Pipeline([
        # Extract column info information from csv

        # Use FeatureUnion to combine the features from subject and body
        ('union', FeatureUnion(
            transformer_list=[

                # Pipeline for pulling custom features from the columns
                # ('custom_features', Pipeline([
                #     ('selector', ItemSelector(key='per_file_rows')),
                #     ('customfeatures', CustomFeatures(n_jobs=n_cores)),
                #     ("customvect", DictVectorizer())
                # ])),
                #
                # Pipeline for standard bag-of-words models for cell values
                ('cell_features', Pipeline([
                    ('selector', ItemSelector(key='all_columns')),
                    ('count', TfidfVectorizer(ngram_range=(1, 3), analyzer="char_wb", binary=False, max_features=2000)),
                ])),

                # Pipeline for standard bag-of-words models for header values
                ('header_features', Pipeline([
                    ('selector', ItemSelector(key='all_headers')),
                    # ('count', TfidfVectorizer(ngram_range=(4, 4), analyzer="char_wb",
                    #                           binary=False, max_features=2000)),
                    ('hash', HashingVectorizer(n_features=2 ** 2, ngram_range=(3, 3), analyzer="char_wb")),

                ])),

            ],

            # weight components in FeatureUnion
            transformer_weights={
                'custom_features': 1.6,
                'cell_features': 1,
                'header_features': .3,
            },

        )),

        # Use a SVC classifier on the combined features
        ('XG', XGBClassifier(n_jobs=n_cores)),

    ])

    grid_search = {
        "n_rows": [20, 50, 75, 100, 200, 300, 500, 700, 1000],
        "n_files": [100, 300, 500, 700, 1000, 1500, None]

    }
    results_dict = {}
    models_dict = {}

    test_global, _ = ColumnInfoExtractor(n_files=None, n_rows=500, train_size=1.0,
                                         n_jobs=n_cores, column_sample=True).transform(
        annotations_file=test_file_path,
        csv_folder=csv_folder_path)

    for n_row, n_file in tqdm(product(*grid_search.values())):
        tqdm.write(f"Using n_rows={n_row} and  n_files={n_file}")
        cie = ColumnInfoExtractor(n_files=n_file, n_rows=n_row, train_size=1,
                                       n_jobs=n_cores, column_sample=True)
        train, _ = cie.transform(annotations_file=train_file_path,
                                 csv_folder=csv_folder_path)

        if not n_file:
            n_file = cie.n_files
        tqdm.write("\nFitting...")
        pipeline.fit(train, train["y"])

        tqdm.write("\nTesting...")
        y_test = test_global["y"]
        y_pred = pipeline.predict(test_global)

        run_f1 = f1_score(y_true=y_test, y_pred=y_pred, average="macro")
        results_dict[f"n_rows:{str(n_row)}_n_files:{str(n_file)}"] = run_f1
        models_dict[f"n_rows:{str(n_row)}_n_files:{str(n_file)}"] = clone(pipeline)

    json.dump(results_dict, open("./data/results_grid_search.json", "w"))

    sorted_grid = sorted(results_dict.items(), key=lambda x: x[1], reverse=True)
    best_config = sorted_grid[0][0]

    # Save pipeline
    joblib.dump(models_dict[best_config], output_model_path + '/best_GS_model.joblib')
