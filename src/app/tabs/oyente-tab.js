var yo = require('yo-yo')
var csjs = require('csjs-inject')
var remix = require('ethereum-remix')
var OyenteAnalyzer = require('../oyente-analyzer/analyzer')

var styleGuide = remix.ui.styleGuide
var styles = styleGuide()
var appProperties = styles.appProperties

// -------------- styling ----------------------

var css = csjs`
  .oyenteTabView {
    padding: 2%;
    display: flex;
  }
  .info {
    ${
      appProperties.uiElements.dottedBorderBox({
        BackgroundColor: appProperties.solidBorderBox_BackgroundColor,
        BorderColor: appProperties.solidBorderBox_BorderColor,
        Color: appProperties.solidBorderBox_TextColor
      })
    }
  }
  .crow_basic {
    display: flex;
    overflow: auto;
    clear: both;
  }
  .crow extends .crow_basic {
    padding: .5em;
  }
  .options {
    margin-top: 1em;
    display: block;
  }
  .analyzeButton {
    ${
        appProperties.uiElements.button({
          BackgroundColor: appProperties.primaryButton_BackgroundColor,
          BorderColor: appProperties.primaryButton_BorderColor,
          Color: appProperties.primaryButton_TextColor
      })
    };
    width: 100%;
    align-self: center;
    text-align: -webkit-center;
    font-size: 12px;
  }
  .settings {
    ${
      appProperties.uiElements.solidBorderBox({
        BackgroundColor: appProperties.solidBorderBox_BackgroundColor,
        BorderColor: appProperties.solidBorderBox_BorderColor,
        Color: appProperties.solidBorderBox_TextColor
      })
    }
    margin-bottom: 2%;
    padding: 10px 15px 15px 15px;
  }
  .col1_1 {
    font-size: 12px;
    width: 25%;
    min-width: 145px;
    float: left;
    align-self: center;
  }
  .col2 {
    ${
      appProperties.uiElements.inputField({
        BackgroundColor: appProperties.input_BackgroundColor,
        BorderColor: appProperties.input_BorderColor,
        Color: appProperties.input_TextColor
      })
    }
  }
  .icon {
    margin-right: 5px;
  }
  .result {
    margin-top: 15px;
  }
`

module.exports = oyenteTab

function oyenteTab (container, appAPI, appEvents, opts) {
  var opt = function (text, input) {
    return yo`
      <div class="${css.crow}">
        <div class="${css.col1_1}">${text}</div>
        ${input}
      </div>
    `
  }

  var z3_timeout = yo`<input class="${css.col2}" name="timeout" type="number" value=100 min=0
    title="Time limit for z3 to solve path constraints during symbolic execution.">`
  var global_timeout = yo`<input class="${css.col2}" name="global_timeout" type="number" value=50 min=0 max=100
    title="Time limit to force Oyente to terminate. Maximum value is 100">`
  var gas_limit = yo`<input class="${css.col2}" name="gaslimit" type="number" value=6700000 min=0
    title="The maximum gas can be used to run Oyente">`
  var depth_limit = yo`<input class="${css.col2}" name="depthlimit" type="number" value=50 min=0
    title="A depth limit for exploring states in symbolic execution. The analysis coverage improves as the depth limit increases, with the cost of longer execution time.">`
  var loop_limit = yo`<input class="${css.col2}" name="looplimit" type="number" value=10 min=0
    title="The maximum number of iterations that Oyente will follow when encounter a loop. Both the analysis accuracy and the run time rise as this value increases.">`
  var email = yo`<input class="${css.col2}" name="email" type="email"
    title="The result will be sent to this email after the analysis is done" placeholder="contact@example.com">`
  var bytecode = yo`<input class="${css.col2}" name="bytecode" type="text">`

  var info = yo`
    <div class="${css.info}">
      <div>The latest supported Solidity version is</div>
      <div>0.4.17+commit.bdeb9e52.Linux.g++</div>
    </div>
  `
  var settings = yo`
    <div class="${css.settings}">
      <div class="${css.options}" id="oyente-options">
        ${opt('Z3 timeout (millisecond)', z3_timeout)}
        ${opt('Global timeout (second)', global_timeout)}
        ${opt('Gas limit', gas_limit)}
        ${opt('Depth limit', depth_limit)}
        ${opt('Loop limit', loop_limit)}
        ${opt('Email', email)}
        ${opt('Runtime bytecode', bytecode)}
      </div>
    </div>
  `
  var analyzeButton = yo`
    <div class="${css.crow_basic}">
      <div class="${css.analyzeButton}" id="analyzeButton" title="Analyze source code's security" onclick=${() => { analyze(appAPI) }}>
        <i class="fa fa-search ${css.icon}" aria-hidden="true"></i>
        Analyze
      </div>
    </div>
  `
  var result = yo`<div class="${css.result}" id="oyenteResult"></div>`

  var el = yo`
    <div class="${css.oyenteTabView}" id="oyenteTabView">
      ${info}
      ${settings}
      ${analyzeButton}
      ${result}
    </div>
  `

    // HELPERS

  function analyze (appAPI) {
    var analyzer = new OyenteAnalyzer(appAPI)
    var bytecode = $("#oyente-options input[name='bytecode']").val()

    if (bytecode) {
      analyzer.analyze_bytecode(bytecode)
    }
    else {
      var currentFile = appAPI.config.get('currentFile')
      var sources = appAPI.files.listAsTree()
      analyzer.analyze(currentFile, sources)
    }
  }

  container.appendChild(el)
}
