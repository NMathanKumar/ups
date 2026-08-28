import Icon from './Icon'

export default function SourceCard({ source }) {
  if (!source) return null
  return (
    <div className="source-card" role="complementary" aria-label="Verified source information">
      <div className="source-card-header">
        <Icon name="check" size={13} />
        Verified Company Information
      </div>
      <div className="source-file">
        <div className="source-file-icon">
          <Icon name="file" size={15} />
        </div>
        <div>
          <div className="source-file-name">{source.fileName}</div>
          <div className="source-file-type">{source.system}</div>
        </div>
      </div>
    </div>
  )
}
