export function MarginNotes() {
  return (
    <aside className="margin-notes">
      <div className="note">
        <span className="note-ref">1</span>
        center-control 会每日更新项目活动指标，展示页默认使用最新导出快照。
      </div>
      <div className="note">
        <span className="note-ref">2</span>
        `debug=1` 模式下可手动选择项目，URL `show=slug1,slug2` 可直接分享。
      </div>
      <div className="note">
        <span className="note-ref">3</span>
        每个展示项目对应一个固定子域名，便于独立传播与追踪。
      </div>
    </aside>
  )
}
