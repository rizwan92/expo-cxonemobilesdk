import Native from '../ExpoCxonemobilesdkModule';

const TAG = '[CXone/Analytics]';

export async function viewPage(title: string, url: string) {
  console.log(TAG, 'viewPage', { title, url });
  await Native.analyticsViewPage(title, url);
}

export async function viewPageEnded(title: string, url: string) {
  console.log(TAG, 'viewPageEnded', { title, url });
  await Native.analyticsViewPageEnded(title, url);
}

export async function chatWindowOpen() {
  console.log(TAG, 'chatWindowOpen');
  await Native.analyticsChatWindowOpen();
}

export async function conversion(type: string, value: number) {
  console.log(TAG, 'conversion', { type, value });
  await Native.analyticsConversion(type, value);
}

