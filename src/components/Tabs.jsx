import { cn } from '../utils/cn';

export default function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('tabs', className)} role="tablist">
      <div className="tabs__scroll">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn('tabs__item', activeTab === tab.id && 'tabs__item--active')}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
            {tab.count != null && (
              <span className={cn('tabs__count', activeTab === tab.id && 'tabs__count--active')}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
