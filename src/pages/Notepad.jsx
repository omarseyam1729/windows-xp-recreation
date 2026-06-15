import { useState, useEffect } from 'react'
import MenuBar from '../components/notepad/MenuBar'
import TextEditor from '../components/notepad/TextEditor'
import { getNode, updateContent } from '../utils/filesystem'

const Notepad = ({ fileId = null }) => {
  // When opened from a desktop text file, load its saved content.
  const [text, setText] = useState(() =>
    fileId ? getNode(fileId)?.content ?? '' : ''
  )

  // Persist edits back to the file in localStorage.
  useEffect(() => {
    if (fileId) {
      updateContent(fileId, text)
    }
  }, [text, fileId])

  const handleDownload = () => {
    if (!text.trim()) {
      alert('No text to download')
      return
    }

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notepad-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleNew = () => {
    if (text.trim() && !confirm('Are you sure you want to create a new document? Unsaved changes will be lost.')) {
      return
    }
    setText('')
  }

  return (
    <div className="flex flex-col h-full -m-4" style={{ minHeight: '370px' }}>
      <MenuBar onNew={handleNew} onSave={handleDownload} />
      <TextEditor 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="Start typing..."
      />
    </div>
  )
}

export default Notepad

