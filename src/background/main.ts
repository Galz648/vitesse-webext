import { onMessage, sendMessage } from 'webext-bridge'
import type { Tabs } from 'webextension-polyfill'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// const alarmClock = {

//   onHandler(e) {
//     console.log('onHandler', e)
//   },
// }
// browser.alarms.onAlarm.addListener(alarmClock.onHandler)

addEventListener('load', async () => {
  browser.alarms.create('alarm', {
    delayInMinutes: 1,
    periodInMinutes: 1,
  })

  console.log('load')
  const state = await browser.idle.queryState(15)
  console.log('state', state)

  const scheduledAlarmTime: { scheduledTime: number } = await browser.alarms.get('alarm')
  console.log('scheduledAlarmTime', scheduledAlarmTime)
  console.log('now', Date.now())
  console.log('scheduledAlarmTime', scheduledAlarmTime?.scheduledTime)

  console.log('starting alarm')

  browser.alarms.onAlarm.addListener(async (alarm) => {
    const state = await browser.idle.queryState(15)
    console.log('state in OnAlarm', state)
    console.log('onAlarm', alarm)
  })
})

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

// browser.alarms.onAlarm.addListener(
//   (alarm: browser.alarms.Alarm): void => {
//     console.log('alarm', alarm)
//   },
// )

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration

browser.tabs.onUpdated.addListener(async () => {
  // browser.alarms.create(
  //   'myAlarm', { delayInMinutes: 1, periodInMinutes: 1 })
  const state = await browser.idle.queryState(15)
  console.log('state', state)
})
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  // browser.alarms.create(
  //   'myAlarm', { delayInMinutes: 1, periodInMinutes: 1 })

  if (!previousTabId)
    previousTabId = tabId

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  // eslint-disable-next-line no-console
  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)

    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})
