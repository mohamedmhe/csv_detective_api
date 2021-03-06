import React, { Component } from "react";
import "./App.css";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";
import Table from "react-bootstrap/Table";
import ReactJson from "react-json-view";
import "bootstrap/dist/css/bootstrap.css";
import Dropzone from "react-dropzone";
import About from "./About";

class App extends Component {
  componentDidMount() {
    document.title = "CSV Detective API";
  }
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      formData: { resource_id: "", resource_id_list: "" },
      resource_chosen: "",
      openPerf: false,

      result: ""
    };
    let tempo = process.env.REACT_APP_API_URL;
    this.url = "";
    if (tempo == null) {
      this.url = "http://localhost:5000/csv_detective/";
      console.log(this.url);
    } else this.url = tempo;
    this.handleChange = this.handleChange.bind(this);
    this.handlePredictClick = this.handlePredictClick.bind(this);
  }

  onDrop = acceptedFiles => {
    let formData = new FormData();
    formData.append("resource_csv", acceptedFiles[0]);
    this.state.formData.resource_id = acceptedFiles[0].name;
    // formData.resource_csv = acceptedFiles[0];
    this.setState({ isLoading: true });
    let urlo = this.url;
    fetch(urlo, {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(result => this.setState({ result, isLoading: false }))
      .catch(console.log);
    // console.log(acceptedFiles);
  };

  handleChange = event => {
    const value = event.target.value;
    const name = event.target.name;
    var formData = this.state.formData;
    formData[name] = value;
    this.setState({
      formData
    });
  };

  handleChangeList = event => {
    const value = event.target.value;
    const name = event.target.name;
    var formData = this.state.formData;
    formData[name] = value;
    this.setState({
      formData
    });
  };

  extractResourceID = stringo => {
    let splitted = stringo.split("(");
    let id = splitted[1];
    id = id.substring(0, id.length - 1);
    return id;
  };
  split;

  updateOpenPerf = () => {
    this.setState({ openPerf: !this.state.openPerf });
  };

  handleCSVResponse = (response, detected_type) => {
    if (!(detected_type in response)) return null;

    return Object.entries(response[detected_type]).map((key_value, index) => {
      return (
        <tr key={index}>
          <td>{key_value[0]}</td>
          <td>{key_value[1]}</td>
        </tr>
      );
    });
  };

  getReferenceDatasets = response => {
    let reference_datasets =
      response.reference_matched_datasets["reference_datasets"];
    let matched_datasets =
      response.reference_matched_datasets["matched_datasets"];

    return Object.entries(matched_datasets).map(key_value => {
      let ref_ds_id = key_value[0]; // this is an int
      let col_types = key_value[1]; // this is a list
      let col_types_str = col_types.join(", ");
      let column_type_str = col_types.length === 1 ? "type" : "types";
      let ref_dataset = reference_datasets[ref_ds_id];
      return (
        <p>
          The column {column_type_str} <b>{col_types_str}</b> could be
          referenced by the dataset{" "}
          <b>
            <a href={ref_dataset["url"]}>{ref_dataset["name"]}</a>
          </b>
          .
        </p>
      );
    });
  };

  handlePredictClick = event => {
    const formData = this.state.formData;
    this.setState({ isLoading: true });
    let resource_id = "";
    if (
      formData.resource_id_list !== "" &&
      formData.resource_id_list !== "Choose..."
    ) {
      resource_id = formData.resource_id_list;
      resource_id = this.extractResourceID(resource_id);
    } else {
      formData.resource_id =
        formData.resource_id !== ""
          ? formData.resource_id
          : "1f0ebe13-e1f3-4adb-833a-dfc1ce8020fa";
      resource_id = formData.resource_id;
    }
    this.setState({ resource_chosen: resource_id });
    let urlo = this.url + `?resource_id=${resource_id}`;
    console.log(urlo);
    // fetch(`http://localhost:5000/csv_detective/?resource_id=${formData.resource_id}`,
    fetch(urlo, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      method: "GET"
    })
      .then(response => response.json())
      .then(result => this.setState({ result, isLoading: false }))
      .catch(console.log);
    console.log(this.state.result);
  };

  render() {
    const isLoading = this.state.isLoading;
    const formData = this.state.formData;
    const result = this.state.result;
    const openAbout = this.state.openAbout;
    const openPerf = this.state.openPerf;

    return (
      <Container>
        <div className="title">
          <h5>
            CSV Detective API
            <sup>
              <font size="1">BETA</font>
            </sup>{" "}
            (Updated 2019-09-04)
          </h5>
        </div>
        <div className="input_content">
          <Form>
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>
                  Enter a{" "}
                  <a
                    href="https://www.data.gouv.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    data.gouv.fr
                  </a>{" "}
                  CSV resource ID:
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 1f0ebe13-e1f3-4adb-833a-dfc1ce8020fa"
                  name="resource_id"
                  value={formData.resource_id}
                  onChange={this.handleChange}
                />
                <div>Or choose one from the examples below:</div>
                <Form.Control
                  as="select"
                  onChange={this.handleChange}
                  name="resource_id_list"
                >
                  <option>Choose...</option>
                  <option>
                    Base des permis de construire [Sitadel]
                    (b326730e-8af7-46ee-a412-00413d7ab7c0)
                  </option>
                  <option>
                    Correspondances-code-insee-code-postal
                    (6d3428b2-3893-45a1-b404-2522a4e77d41)
                  </option>
                  <option>
                    Données des permis de construire pour les logements
                    (2ddc97c8-c265-4dfe-a6c4-51f214f54871)
                  </option>
                  <option>
                    Open Food Facts (164c9e57-32a7-4f5b-8891-26af10f91072)
                  </option>
                  <option>
                    Trafic moyen journalier annuel sur le réseau routier
                    national (72b6729e-c675-41ea-bd41-ea0a0daf5642)
                  </option>
                </Form.Control>
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group as={Col}>
                <Button
                  block
                  variant="success"
                  disabled={isLoading}
                  onClick={!isLoading ? this.handlePredictClick : null}
                >
                  {isLoading ? "Making analysis" : "Submit"}
                </Button>
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group as={Col}>
                <Dropzone
                  onDrop={this.onDrop}
                  accept="text/csv"
                  maxSize={5242880}
                >
                  {({
                    getRootProps,
                    getInputProps,
                    isDragActive,
                    isDragReject,
                    rejectedFiles
                  }) => {
                    const isFileTooLarge =
                      rejectedFiles.length > 0 &&
                      rejectedFiles[0].size > 5242880;
                    return (
                      <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        {!isDragActive && (
                          <div>
                            Or upload a CSV by clicking or dropping it (and then
                            WAITING some time) <font color="#0000EE">here</font>{" "}
                            (max 5mb)
                          </div>
                        )}
                        {isDragActive &&
                          !isDragReject &&
                          "Drop it like it's hot!"}
                        {isDragReject && "File type not accepted, sorry!"}
                        {isFileTooLarge && (
                          <div className="text-danger mt-2">
                            File is too large.
                          </div>
                        )}
                      </div>
                    );
                  }}
                </Dropzone>
              </Form.Group>
            </Form.Row>
            <Form.Row></Form.Row>
          </Form>
        </div>
        {(() => {
          if (result !== "" && Object.keys(result["metadata"]).length !== 0) {
            return (
              <div className="input_content">
                <Row>
                  <Col>
                    <h3>Resource {this.state.resource_chosen}</h3>
                  </Col>
                </Row>
              </div>
            );
          }
        })()}

        {(() => {
          if (result !== "" && Object.keys(result["metadata"]).length !== 0) {
            return (
              // <div>
              //   <h2>{this.resource_chosen}</h2>
              // </div>
              <div className="results_content">
                <Row>
                  <Col>
                    <h3>Metadata</h3>
                  </Col>
                </Row>
                <Row>
                  {(() => {
                    if (
                      result !== "" &&
                      Object.keys(result["metadata"]).length !== 0
                    ) {
                      return (
                        <Col>
                          <ReactJson
                            src={result["metadata"]}
                            collapsed={1}
                            name={false}
                            displayDataTypes={false}
                          />
                        </Col>
                      );
                    }
                  })()}
                </Row>
              </div>
            );
          }
        })()}

        {(() => {
          if (result !== "") {
            return (
              <div className="results_content">
                <Row>
                  <Col>
                    <h3>Identified Columns (Rule Based)</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    {result === "" ? null : (
                      <Table hover size="sm">
                        <thead>
                          <tr>
                            <th>Column Name</th>
                            <th>Type Detected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.handleCSVResponse(result, "columns_rb")}
                        </tbody>
                      </Table>
                    )}
                  </Col>
                </Row>
              </div>
            );
          }
        })()}

        {(() => {
          if (result !== "" && Object.keys(result["columns_ml"]).length !== 0) {
            return (
              <div className="results_content_ml">
                <Row>
                  <Col>
                    <h3>Identified Columns (Machine Learning Based)</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    {result === "" ? null : (
                      <Table hover size="sm">
                        <thead>
                          <tr>
                            <th>Column Name</th>
                            <th>Type Detected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.handleCSVResponse(result, "columns_ml")}
                        </tbody>
                      </Table>
                    )}
                  </Col>
                </Row>
              </div>
            );
          }
        })()}

        {(() => {
          if (result !== "") {
            return (
              <div className="results_content">
                <Row>
                  <Col>
                    <h3>Reference Datasets</h3>
                  </Col>
                </Row>
                <Row>
                  {(() => {
                    if (
                      Object.keys(
                        result["reference_matched_datasets"]["matched_datasets"]
                      ).length !== 0
                    ) {
                      return <Col>{this.getReferenceDatasets(result)}</Col>;
                    } else {
                      return (
                        <Col>
                          No reference datasets where found for your dataset
                          ¯\_(ツ)_/¯
                        </Col>
                      );
                    }
                  })()}
                </Row>
              </div>
            );
          }
        })()}

        <About />

        <div className="performance_content">
          <Row>
            <Col>
              <h3 onClick={this.updateOpenPerf}>Current Performance</h3>
            </Col>
          </Row>
          <Collapse in={openPerf}>
            <div>
              <Row>
                <Col>
                  <p>Rule Based</p>
                  <img
                    src="https://img.shields.io/badge/F--score-84.1-green"
                    alt="F1-score=84.1"
                  ></img>
                </Col>
                <Col>
                  <p>Machine Learning Based</p>
                  <img
                    src="https://img.shields.io/badge/F--score-87.1-green"
                    alt="F1-score=87.1"
                  ></img>
                </Col>
              </Row>
            </div>
          </Collapse>
        </div>
      </Container>
    );
  }
}

export default App;
