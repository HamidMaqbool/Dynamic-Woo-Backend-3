
export type ValidationRule = (value: any, fieldName: string) => string | null;

export const rules = {
    required: (value: any, fieldName: string) => 
        !value || (typeof value === 'string' && value.trim() === '') ? `${fieldName} is required` : null,
    
    email: (value: any, fieldName: string) => 
        value && !/\S+@\S+\.\S+/.test(value) ? `${fieldName} must be a valid email` : null,
    
    minLength: (min: number) => (value: any, fieldName: string) => 
        value && value.length < min ? `${fieldName} must be at least ${min} characters` : null,
    
    maxLength: (max: number) => (value: any, fieldName: string) => 
        value && value.length > max ? `${fieldName} must be at most ${max} characters` : null,
    
    numeric: (value: any, fieldName: string) => 
        value && isNaN(Number(value)) ? `${fieldName} must be a number` : null,
    
    url: (value: any, fieldName: string) => 
        value && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(value) ? `${fieldName} must be a valid URL` : null,
};

export function validate(data: Record<string, any>, schema: Record<string, ValidationRule[]>) {
    const errors: Record<string, string> = {};
    
    Object.keys(schema).forEach(field => {
        const fieldRules = schema[field];
        if (!fieldRules) return;
        
        for (const rule of fieldRules) {
            const error = rule(data[field], field);
            if (error) {
                errors[field] = error;
                break;
            }
        }
    });
    
    return errors;
}
