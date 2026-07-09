import React from 'react';
import Select from 'react-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

const ReportAssignment = ({ orgUsers, selectedUsers, onAssignReport }) => {
    const { theme } = useTheme();

    const options = orgUsers.map(user => ({
        value: user.id,
        label: `${user.name} (${user.user_type})`
    }));

    const selectedOptions = selectedUsers.map(user => ({
        value: user.id,
        label: `${user.name} (${user.user_type})`
    }));

    const handleChange = (selected) => {
        const selectedIds = selected ? selected.map(s => s.value) : [];
        onAssignReport(selectedIds);
    };

    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#121212' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#2e2e2e' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 1px #ff5100' : 'none',
            '&:hover': {
                borderColor: '#ff5100',
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#121212' : '#FFFFFF',
            zIndex: 50,
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? '#ff5100' 
                : state.isFocused 
                ? (theme === 'dark' ? '#2e2e2e' : '#f3f4f6') 
                : 'transparent',
            color: state.isSelected ? 'white' : (theme === 'dark' ? 'white' : 'black'),
            '&:active': {
                backgroundColor: '#ff5100'
            },
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#2e2e2e' : '#f3f4f6',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: theme === 'dark' ? 'white' : 'black',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            '&:hover': {
                backgroundColor: '#ff5100',
                color: 'white',
            },
        }),
        input: (provided) => ({
            ...provided,
            color: theme === 'dark' ? 'white' : 'black',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        }),
        singleValue: (provided) => ({
            ...provided,
            color: theme === 'dark' ? 'white' : 'black',
        }),
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Assign Report</CardTitle>
            </CardHeader>
            <CardContent>
                <Select
                    isMulti
                    options={options}
                    value={selectedOptions}
                    onChange={handleChange}
                    styles={selectStyles}
                    placeholder="Search and select users..."
                    noOptionsMessage={() => "No users found"}
                />
            </CardContent>
        </Card>
    );
};

export default ReportAssignment;