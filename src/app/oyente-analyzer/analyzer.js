var $ = require('jquery')
var yo = require('yo-yo')
var csjs = require('csjs-inject')
var remix = require('ethereum-remix')

var styleGuide = remix.ui.styleGuide
var styles = styleGuide()
var appProperties = styles.appProperties

var css = csjs`
  .warning_box {
    ${
      appProperties.uiElements.dottedBorderBox({
        BackgroundColor: appProperties.solidBorderBox_BackgroundColor,
        BorderColor: appProperties.solidBorderBox_BorderColor,
        Color: appProperties.solidBorderBox_TextColor
      })
    }
    border-color: red;
  }
  .safe_box {
    ${
      appProperties.uiElements.dottedBorderBox({
        BackgroundColor: appProperties.solidBorderBox_BackgroundColor,
        BorderColor: appProperties.solidBorderBox_BorderColor,
        Color: appProperties.solidBorderBox_TextColor
      })
    }
    border-color: green;
  }
  .details {
    ${styles.rightPanel.compileTab.button_Details};
  }
  .hide {
    display: none;
  }
  .col1_1 {
    font-size: 12px;
    width: 25%;
    min-width: 235px;
    float: left;
    align-self: center;
  }
  .contract {
    text-align: center;
  }
`

function Analyzer (appAPI) {
  this.analyze = function (current_file, sources) {
    analysisStarted()

    var data = get_options()
    data['sources'] = JSON.stringify(sources)
    data['current_file'] = current_file
    var cb = {}

    cb.error = function () {
      var error = yo`<div>
        Some errors occured. Please try again!
      </div>`
      analysisFinished(error)
    }

    cb.success = function (response) {
      var sources = response.sources
      var ret = yo`<div>
        ${Object.keys(sources).map(function (source) {
          return yo`<div>
            <div style="font-weight: bold">${source}</div>
              ${Object.keys(sources[source]).map(function (contract) {
                return yo`<div>
                  <div class="${ border_color(sources[source][contract]) }">
                    <div>${general_result(sources, source, contract)}</div>
                    <div>
                      <div class="${ display_details(sources[source][contract]) }" onclick=${(e) => { details(e) }}>Details</div>
                      ${ render_details( yo`<div style='display: none'></div>`, sources[source][contract], appAPI ) }
                    </div>
                  </div>
                </div>`
              })}
          </div>`
        })}
      </div>`
      analysisFinished(ret)
    }
    request_analysis(data, cb)
  }
}

module.exports = Analyzer

    // HELPERS

function get_options () {
  var data = {}
  $('#oyente-options input').each( function () {
    var attr = $(this).attr('name')
    var val = $(this).val()
    if (val) {
      data[attr] = val
    }
  })
  return data
}

function border_color (contract) {
  if (any_bug(contract)) {
    return `${css.warning_box}`
  }
  else {
    return `${css.safe_box}`
  }
}

function display_details (contract) {
  if (any_bug(contract)) {
    return `${css.details}`
  }
  else {
    return `${css.hide}`
  }
}

function any_bug (contract) {
  for (var bug in contract.bugs) {
    if (contract.bugs.hasOwnProperty(bug)) {
      if (contract.bugs[bug] !== false) {
        return true
      }
    }
  }
  return false
}

function general_result (sources, source, contract) {
  var bugs = sources[source][contract]["bugs"]
  var bug_names = {
    callstack: "Callstack Depth Attack Vulnerability",
    money_concurrency: "Transaction-Ordering Dependence (TOD)",
    time_dependency: "Timestamp Dependency",
    reentrancy: "Re-Entrancy Vulnerability",
    assertion_failure: "Assertion failure"
  }

  return yo`
    <div>
      <div class="${css.contract}">${source}:${contract}</div>
      <div>
        <div class="${css.col1_1}">EVM code coverage:</div>
        <div>${sources[source][contract].evm_code_coverage}%</div>
      </div>
      ${Object.keys(bugs).map(function (bug) {
          return yo`
            <div>
              <div class="${css.col1_1}">${bug_names[bug]}:</div>
              ${ bug_exist(yo`<div></div>`, bugs[bug]) }
            </div>
          `
        })
      }
    </div>
  `
}


function bug_exist (el, bug_value) {
  var $el = $(el)
  if (bug_value === false) {
    $el.css('color', 'green').text("False")
  }
  else {
    $el.css('color', 'red').text("True")
  }
  return el
}

function details (e) {
  var el = e.target || e.srcElement
  $(el).next().fadeToggle()
}

function render_details (el, contract, appAPI) {
  for (var bug in contract.bugs) {
    if (contract.bugs.hasOwnProperty(bug) && contract.bugs[bug] !== false) {
      appAPI.oyenteMessage(contract.bugs[bug], $(el), {type: "warning"})
    }
  }
  return el
}

function analysisStarted () {
  var el = yo`
    <span>
      <i class="fa fa-cog fa-spin fa-fw">  </i>
      Analyzing ...
    </span>
  `
  $('#analyzeButton').html(el).css('pointer-events', 'none')
  $('#oyenteResult').empty().hide()
}

function analysisFinished (results) {
  var el = yo`
    <span>
      <i class="fa fa-search" aria-hidden="true">  </i>
      Analyze
    </span>
  `
  $('#oyenteResult').append(results)
  $('#analyzeButton').html(el).css('pointer-events', 'auto')
  $('#oyenteResult').fadeIn()
}

function request_analysis (data, cb) {
  $.ajax({
    type: 'POST',
    url: 'home/analyze',
    data: { 'data': data },
    dataType: 'json',
    error: function(jqXHR, exception) {
      cb.error()
    },
    success: function (response) {
      cb.success(response)
    }
  })
}
