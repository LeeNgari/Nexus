import React, { useState } from "react"

export function Tabs({ defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const tabsList = React.Children.toArray(children).find((child) => child.type === TabsList)
  const tabsContent = React.Children.toArray(children).filter((child) => child.type === TabsContent)

  const clonedTabsList = React.cloneElement(tabsList, {
    activeTab,
    setActiveTab,
  })

  const clonedTabsContent = tabsContent.map((content) => React.cloneElement(content, { activeTab }))

  return (
    <div className="flex flex-col w-full">
      {clonedTabsList}
      <div className="mt-4">
        {clonedTabsContent}
      </div>
    </div>
  )
}

export function TabsList({ children, activeTab, setActiveTab }) {
  const clonedChildren = React.Children.map(children, (child) => 
    React.cloneElement(child, { activeTab, setActiveTab })
  )

  return (
    <div className="flex space-x-1 bg-muted p-1 rounded-lg">
      {clonedChildren}
    </div>
  )
}

export function TabsTrigger({ value, children, activeTab, setActiveTab }) {
  return (
    <button
      className={`
        flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors
        ${activeTab === value 
          ? 'bg-white text-black shadow-sm' 
          : 'text-muted-foreground hover:text-foreground'
        }
      `}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, activeTab }) {
  return (
    <div className={`
      ${activeTab === value ? 'block' : 'hidden'}
      animate-fade-in
    `}>
      {children}
    </div>
  )
}