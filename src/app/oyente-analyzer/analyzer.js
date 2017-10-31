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
  .title {
    text-align: center;
  }
`

function Analyzer (appAPI) {
  this.analyze_bytecode = function (bytecode) {
    analysisStarted()
    var data = get_options()
    data['bytecode'] = bytecode
    var cb = {}

    cb.error = error

    cb.success = function (response) {
      var result = response.result
      if (result.hasOwnProperty('error')) {
        var err = yo`<div></div>`
        analysisFinished(render_error(err, result.error, appAPI))
      }
      else {
        var ret = yo`
          <div>
            <div class="${border_color(result)}">
              <div>${general_result(result, 'Bytecode analysis result')}</div>
            </div>
          </div>
        `
        analysisFinished(ret)
      }
    }
    request_analysis('home/analyze_bytecode', data, cb)
  }

  this.analyze = function (current_file, sources) {
    analysisStarted()

    var data = get_options()
    data['sources'] = JSON.stringify(sources)
    data['current_file'] = current_file
    var cb = {}

    cb.error = error

    cb.success = function (response) {
      var sources = response.sources
      if (sources.hasOwnProperty('error')) {
        var err = yo`<div></div>`
        analysisFinished(render_error(err, sources.error, appAPI))
      }
      else {
        var ret = yo`<div>
          ${Object.keys(sources).map(function (source) {
            return yo`<div>
              <div style="font-weight: bold">${source}</div>
                ${Object.keys(sources[source]).map(function (contract) {
                  return yo`<div>
                    <div class="${ border_color(sources[source][contract]) }">
                      <div>${general_result(sources[source][contract], `${source}:${contract}`)}</div>
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
    }
    request_analysis('home/analyze', data, cb)
  }
}

module.exports = Analyzer

    // HELPERS

function error (jqXHR, exception) {
  var error = yo`<div>
    Some errors occured. Please try again!
  </div>`
  analysisFinished(error)
}

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
  for (var vul in contract.vulnerabilities) {
    var warnings = contract.vulnerabilities[vul]
    if (warnings instanceof Array) {
      if (warnings.length > 0) return true
    }
    else {
      if (warnings) return true
    }
  }
  return false
}

function general_result (result, title) {
  var vul_names = {
    callstack: "Callstack Depth Attack Vulnerability",
    money_concurrency: "Transaction-Ordering Dependence (TOD)",
    time_dependency: "Timestamp Dependency",
    reentrancy: "Re-Entrancy Vulnerability",
    assertion_failure: "Assertion Failure"
  }
  var vuls = result["vulnerabilities"]

  return yo`
    <div>
      <div class="${css.title}">${title}</div>
      <div>
        <div class="${css.col1_1}">EVM code coverage:</div>
        <div>${result.evm_code_coverage}%</div>
      </div>
      ${Object.keys(vuls).map(function (vul) {
          return yo`
            <div>
              <div class="${css.col1_1}">${vul_names[vul]}:</div>
              ${ is_vulnerable(yo`<div></div>`, vuls[vul]) }
            </div>
          `
        })
      }
    </div>
  `
}


function is_vulnerable (el, warnings) {
  var $el = $(el)
  if (warnings instanceof Array) {
    if (warnings.length > 0) {
      $el.css('color', 'red').text("True")
    }
    else {
      $el.css('color', 'green').text("False")
    }
  }
  else {
    if (warnings) {
      $el.css('color', 'red').text("True")
    }
    else {
      $el.css('color', 'green').text("False")
    }
  }
  return el
}

function details (e) {
  var el = e.target || e.srcElement
  $(el).next().fadeToggle()
}

function render_details (el, contract, appAPI) {
  for (var vul in contract.vulnerabilities) {
    // contract.vulnerabilities[vul].forEach(function (warning) {
    for (var i in contract.vulnerabilities[vul]) {
      var warning = contract.vulnerabilities[vul][i]
      if (warning instanceof Array) { //money concurrency
        for (var j in warning) {
          if (j == 0) {
            var s = `Flow ${i}\n`
          }
          else {
            var s = ''
          }
          s += warning[j]
          appAPI.oyenteMessage(s, $(el), {type: "warning"})
        }
      }
      else {
        appAPI.oyenteMessage(warning, $(el), {type: "warning"})
      }
    }
  }
  return el
}

function render_error (el, message, appAPI) {
  appAPI.oyenteMessage(message, $(el), {type: 'error'})
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

function request_analysis (url, data, cb) {
  $.ajax({
    type: 'POST',
    url: url,
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
